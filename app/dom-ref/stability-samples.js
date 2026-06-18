export const DOM_REF_STABILITY_SAMPLES = [
  {
    id: 'qa-address-instrumented-control',
    intent: 'QA 좌표가 있는 요소는 label/class/id보다 qa-sdk 좌표가 더 안정적인 식별자다.',
    html: '<form><button id="save" class="btn primary" data-qa-address="checkout:save">Save</button></form>',
    targetSelector: '[data-qa-address="checkout:save"]',
    expectedPrimary: {
      kind: 'attr',
      value: '[data-qa-address="checkout:save"]',
      stability: 95,
      provenance: 'data-qa-address',
    },
  },
  {
    id: 'duplicate-test-id-demoted',
    intent: '중복된 test id는 의미는 있지만 단일 요소를 가리키지 못하므로 primary가 되면 안 된다.',
    html: [
      '<section>',
      '  <button data-testid="action" data-case-target="first">Cancel</button>',
      '  <button data-testid="action">Save</button>',
      '</section>',
    ].join(''),
    targetSelector: '[data-case-target="first"]',
    expectedPrimary: {
      kind: 'css',
      value: 'section > button:nth-of-type(1)',
      stability: 75,
      provenance: 'short-css-path',
    },
    demotedSymbol: {
      kind: 'attr',
      value: '[data-testid="action"]',
      stability: 40,
    },
  },
  {
    id: 'generated-headlessui-id-demoted',
    intent: 'Headless UI/React가 만든 id는 렌더마다 바뀔 수 있어 id primary로 승격하지 않는다.',
    html: '<nav><button id="headlessui-menu-button-:r1:" class="menu-trigger">Menu</button></nav>',
    targetSelector: 'button',
    expectedPrimary: {
      kind: 'css',
      value: 'nav > button.menu-trigger',
      stability: 75,
      provenance: 'short-css-path',
    },
    demotedSymbol: {
      kind: 'id',
      value: '#headlessui-menu-button-\\:r1\\:',
      stability: 55,
    },
  },
  {
    id: 'stable-author-id-retained',
    intent: '사람이 작성한 안정적인 id는 별도 좌표가 없을 때 가장 읽기 쉬운 primary가 될 수 있다.',
    html: '<article><h2 id="pricing-heading">Pricing</h2></article>',
    targetSelector: '#pricing-heading',
    expectedPrimary: {
      kind: 'id',
      value: '#pricing-heading',
      stability: 85,
      provenance: 'id',
    },
  },
]
