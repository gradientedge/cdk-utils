// Force dark mode
document.documentElement.dataset.theme = 'dark'
localStorage.setItem('tsd-theme', 'dark')

document.addEventListener('DOMContentLoaded', () => {
  // Redirect the top sidenav link to the homepage
  const navLink = document.querySelector('.site-menu > nav.tsd-navigation > a')
  if (navLink && navLink.getAttribute('href') === 'modules.html') {
    navLink.setAttribute('href', 'index.html')
  }

  // Hide "On This Page" table of contents on the home page
  const isHome =
    window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/')
  if (isHome) {
    const toc = document.querySelector('.tsd-page-navigation')
    if (toc) toc.style.display = 'none'

    // Hide the extra page title on homepage
    const pageTitle = document.querySelector('.tsd-page-title')
    if (pageTitle) pageTitle.style.display = 'none'
  }

  // Set dynamic year in footer
  const yearEl = document.getElementById('footer-year')
  if (yearEl) yearEl.textContent = new Date().getFullYear()


  // --- 2. Back-to-top button ---
  const btn = document.createElement('button')
  btn.className = 'back-to-top'
  btn.setAttribute('aria-label', 'Back to top')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('fill', 'currentColor')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M3.2 9.6L8 4.8l4.8 4.8H3.2z')
  svg.appendChild(path)
  btn.appendChild(svg)
  document.body.appendChild(btn)

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  let scrollTimeout
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      btn.classList.toggle('visible', window.scrollY > 300)
    }, 50)
  })

  // --- 4. Keyboard shortcut for search (/ or Cmd+K) ---
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    const isCmdK = (e.metaKey || e.ctrlKey) && e.key === 'k'
    const isSlash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey

    if (isCmdK || isSlash) {
      e.preventDefault()
      const searchTrigger = document.getElementById('tsd-search-trigger')
      if (searchTrigger) searchTrigger.click()
    }
  })

  // --- 5. Active sidebar highlighting ---
  const currentPath = window.location.pathname.split('/').pop()
  document.querySelectorAll('nav.tsd-navigation a').forEach((link) => {
    const href = link.getAttribute('href')
    if (href && href.split('/').pop() === currentPath) {
      link.classList.add('sidebar-active')
    }
  })

  // --- 7. Package version badges (shields.io) ---
  const npmBadges = {
    'cdk-utils-aws': '@gradientedge/cdk-utils-aws',
    'cdk-utils-azure': '@gradientedge/cdk-utils-azure',
    'cdk-utils-cloudflare': '@gradientedge/cdk-utils-cloudflare',
    'cdk-utils-common': '@gradientedge/cdk-utils-common',
  }
  document.querySelectorAll('.tsd-page-title h1').forEach((h1) => {
    const text = h1.textContent || ''
    for (const [key, pkg] of Object.entries(npmBadges)) {
      if (text.includes(key)) {
        const badge = document.createElement('img')
        badge.src = 'https://img.shields.io/npm/v/' + pkg + '?style=flat-square&color=58a6ff'
        badge.alt = pkg + ' version'
        badge.className = 'version-badge'
        h1.appendChild(badge)
        break
      }
    }
  })

  // --- 8. "Edit on GitHub" link ---
  const sourceLinks = document.querySelectorAll('.tsd-sources a')
  if (sourceLinks.length > 0) {
    const editContainer = document.createElement('div')
    editContainer.className = 'edit-on-github'

    const editLink = document.createElement('a')
    editLink.href = 'https://github.com/gradientedge/cdk-utils'
    editLink.target = '_blank'
    editLink.rel = 'noopener noreferrer'

    const ghSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    ghSvg.setAttribute('width', '14')
    ghSvg.setAttribute('height', '14')
    ghSvg.setAttribute('viewBox', '0 0 16 16')
    ghSvg.setAttribute('fill', 'currentColor')
    ghSvg.style.verticalAlign = '-2px'
    ghSvg.style.marginRight = '4px'
    const ghPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    ghPath.setAttribute(
      'd',
      'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'
    )
    ghSvg.appendChild(ghPath)
    editLink.appendChild(ghSvg)
    editLink.appendChild(document.createTextNode('Edit on GitHub'))

    editContainer.appendChild(editLink)

    const pageTitle = document.querySelector('.tsd-page-title')
    if (pageTitle) {
      pageTitle.style.position = 'relative'
      pageTitle.appendChild(editContainer)
    }
  }
})
