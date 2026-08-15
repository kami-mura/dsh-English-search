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
    },
  }
  vm.runInNewContext(clientCode, context)
  const plugin = handoff.factory(() => ({}))
  plugin.apply({
    effect() {},
    get() {
      return {
        inject(name) {
          injected.push(name)
        },
      }
    },
  })

  assert.deepEqual(injected, ['conversation.input.dock'])
})
