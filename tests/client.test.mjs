import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const clientCode = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')

test('declares the client packages that own slots and conversation.input.dock', () => {
  assert.deepEqual(packageJson.dsh.client.inject, [
    '@deepseek-ai/dsh-client-runtime',
    '@deepseek-ai/dsh-client-ui-conversation',
  ])
})

test('client bundle declares the slots service', () => {
  let handoff
  vm.runInNewContext(clientCode, {
    window: {
      __ModuleLoader__: {
        load(value) {
          handoff = value
        },
      },
    },
  })

  assert.equal(handoff.id, 'dsh-english-search')
  const plugin = handoff.factory(() => ({}))
  assert.deepEqual([...plugin.inject], ['slots'])
  assert.equal(typeof plugin.apply, 'function')
})

test('client bundle mounts into the input dock supported by DSH rc.6', () => {
  let handoff
  const injected = []
  let registeredComponent
  const conversationRoot = {}
  const context = {
    window: {
      __ModuleLoader__: {
        load(value) {
          handoff = value
        },
      },
    },
    document: {
      createElement() {
        return { dataset: {}, parentNode: null, textContent: '' }
      },
      head: {
        appendChild() {},
      },
      querySelector() {
        return { parentElement: conversationRoot }
      },
    },
  }
  vm.runInNewContext(clientCode, context)
  const React = {
    createElement(type) {
      return { type }
    },
  }
  const ReactDOM = {
    createPortal(child, target) {
      return { child, target }
    },
  }
  const plugin = handoff.factory((specifier) => specifier === 'react' ? React : ReactDOM)
  plugin.apply({
    effect() {},
    get() {
      return {
        inject(name, register) {
          injected.push(name)
          register()
        },
        register(_options, component) {
          registeredComponent = component
          return () => {}
        },
      }
    },
  })

  assert.deepEqual(injected, ['conversation.input.dock'])
  const portal = registeredComponent()
  assert.equal(portal.target, conversationRoot)
  assert.equal(typeof portal.child.type, 'function')
})
