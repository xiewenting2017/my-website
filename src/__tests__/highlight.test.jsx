import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderHighlightText } from '../App.jsx'

/** 把返回的混合数组拆成 字符串段 和 React 元素段，方便断言 */
function splitParts(parts) {
  return {
    strings: parts.filter((p) => typeof p === 'string'),
    elements: parts.filter((p) => isValidElement(p)),
    text: parts
      .map((p) => (isValidElement(p) ? p.props.children : p))
      .join(''),
  }
}

describe('renderHighlightText', () => {
  it('成对闭合的 <hl> 渲染为高亮 span，其余保持普通字符串', () => {
    const parts = renderHighlightText(
      '您有2条未读：<hl>1条公告通知</hl>和<hl>1条合同到期预警</hl>，建议优先处理。'
    )
    const { strings, elements, text } = splitParts(parts)

    // 完整文本不丢字
    expect(text).toBe('您有2条未读：1条公告通知和1条合同到期预警，建议优先处理。')

    // 两个高亮 span
    expect(elements).toHaveLength(2)
    for (const el of elements) {
      expect(el.type).toBe('span')
      expect(el.props.className).toContain('text-[#FDF5B2]')
      expect(el.props.className).toContain('underline')
      expect(el.props.className).toContain('decoration-1')
    }
    expect(elements[0].props.children).toBe('1条公告通知')
    expect(elements[1].props.children).toBe('1条合同到期预警')

    // 其余为普通字符串
    expect(strings).toEqual(['您有2条未读：', '和', '，建议优先处理。'])
  })

  it('未闭合的 <hl> 剥掉标签按普通文本渲染', () => {
    const parts = renderHighlightText('您有：王晨提交的<hl>12680元采购')
    const { elements, text } = splitParts(parts)

    expect(elements).toHaveLength(0)
    expect(text).toBe('您有：王晨提交的12680元采购')
    expect(parts).toEqual(['您有：王晨提交的12680元采购'])
  })

  it('末尾半截标签不渲染（<h / <）', () => {
    expect(splitParts(renderHighlightText('您有2条未读：<h')).text).toBe('您有2条未读：')
    expect(splitParts(renderHighlightText('您有2条未读：<')).text).toBe('您有2条未读：')
    expect(splitParts(renderHighlightText('您有2条未读：</h')).text).toBe('您有2条未读：')
    expect(splitParts(renderHighlightText('您有2条未读：<hl')).text).toBe('您有2条未读：')
  })

  it('高亮词与普通文本中的同名词互不影响', () => {
    const parts = renderHighlightText('<hl>词</hl>后的合同与<hl>合同</hl>无关')
    const { elements, text } = splitParts(parts)

    expect(text).toBe('词后的合同与合同无关')
    expect(elements).toHaveLength(2)
    expect(elements[0].props.children).toBe('词')
    expect(elements[1].props.children).toBe('合同')

    // 中间的普通「合同」是字符串段，不在任何 span 中
    const middle = parts[1]
    expect(typeof middle).toBe('string')
    expect(middle).toBe('后的合同与')
    expect(parts[3]).toBe('无关')
  })
})
