import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import RegionFilterSwitches from '../RegionFilterSwitches.vue'

function makeStore() {
  return {
    north: false,
    mid: false,
    south: false,
    east: false,
    out: false,
    resetFilter: vi.fn()
  }
}

describe('RegionFilterSwitches', () => {
  it('切換北部開關會更新傳入 store 的 north 欄位', async () => {
    const store = makeStore()
    const wrapper = mount(RegionFilterSwitches, {
      props: { store },
      global: { plugins: [ElementPlus] }
    })

    const switches = wrapper.findAll('.el-switch')
    expect(switches).toHaveLength(5)
    await switches[0].trigger('click')

    expect(store.north).toBe(true)
  })

  it('點擊重置按鈕會呼叫 store.resetFilter', async () => {
    const store = makeStore()
    const wrapper = mount(RegionFilterSwitches, {
      props: { store },
      global: { plugins: [ElementPlus] }
    })

    await wrapper.get('.el-button').trigger('click')

    expect(store.resetFilter).toHaveBeenCalledTimes(1)
  })
})
