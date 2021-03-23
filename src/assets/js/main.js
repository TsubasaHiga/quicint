'use strict'

// babel polyfill
import 'core-js/stable'

// define
import EL from './constant/elements'

// helper
import hmb from './helper/hmb'
import uaDataset from './helper/uaDataset'
import sweetScrollInit from './helper/sweetScrollInit'
import ieSmoothScrollDisable from './helper/ieSmoothScrollDisable'
import getTouchSupport from './helper/getTouchSupport'
import navCurrent from './helper/navCurrent'
import getDocumentH from './helper/getDocumentHeight'
import getOrientation from './helper/getOrientation'
import getClassName from './helper/getClassName'
import addAnimationClass from './helper/addAnimationClass'
import set100vh from './helper/set100vh'
import smoothScroll from './helper/smoothScroll'
import getDeviceType from './helper/getDeviceType'

// plugins
import objectFitImages from 'object-fit-images'
import picturefill from 'picturefill'
import Stickyfill from 'stickyfilljs'
import { throttle, debounce } from 'throttle-debounce'

// page scripts
import pageNameTop from './page/top'

// require
require('intersection-observer')
require('focus-visible')

// ua
let ua = null

// className
let className = null

// lastInnerWidth
let lastInnerWidth = window.innerWidth

// innerHeight
let innerHeight = window.innerHeight

/**
 * getScrollPos
 */
const getScrollPos = () => {
  const y = Math.round(window.pageYOffset)
  const offset = className === 'top' ? innerHeight : 200
  const documentH = getDocumentH()

  // add class is-scroll
  if (y > offset) {
    if (!EL.HTML.classList.contains('is-scroll')) {
      EL.HTML.classList.add('is-scroll')
    }
  } else {
    EL.HTML.classList.remove('is-scroll')
  }

  // add class is-footer
  if (documentH <= y) {
    if (!EL.HTML.classList.contains('is-footer')) {
      EL.HTML.classList.add('is-footer')
    }
  } else {
    EL.HTML.classList.remove('is-footer')
  }
}

/**
 * resize
 */
const resize = () => {
  // set100vh（常に更新）
  set100vh('--vh-always')

  // window高さが高くなった時
  if (window.innerHeight > innerHeight) {
    set100vh('--vh-max')
  }

  // window幅が変わった時
  if (lastInnerWidth !== window.innerWidth) {
    lastInnerWidth = window.innerWidth

    // set100vh
    set100vh()
  }

  innerHeight = window.innerHeight
}

/**
 * firstRun
 */
const firstRun = () => {
  // set ua dataset
  ua = uaDataset()

  // set touch support dataset
  ua.touchsupport = getTouchSupport()

  // getOrientation
  getOrientation()

  // ie smoothScroll disable
  ieSmoothScrollDisable(true)

  // Polyfill object-fit
  objectFitImages()

  // Polyfill picturefill
  picturefill()

  if (getDeviceType() === 'lg') {
    EL.NAV.style.visibility = ''
  }

  // set100vh
  set100vh()

  // set100vh（常に更新）
  set100vh('--vh-always')
}

/**
 * initOnce
 */
const initOnce = () => {
  // sweetScroll
  sweetScrollInit()

  // navCurrent
  navCurrent()

  // smoothScroll
  smoothScroll(ua)

  // hmb menu
  hmb()
}

/**
 * initRun
 */
const initRun = () => {
  // set100vh
  set100vh()

  // set100vh（常に更新）
  set100vh('--vh-always')

  // get body className
  className = getClassName(EL.BODY)

  // stickyfilljs
  Stickyfill.add(EL.STICKY)

  // getScrollPos
  getScrollPos()

  // addAnimationClass
  const animations = document.querySelectorAll('.c-animation')
  if (animations) addAnimationClass(animations)

  // top
  if (className.endsWith('top')) pageNameTop()

  EL.HTML.classList.add('is-loaded')
}

/**
 * DOMCONTENTLOADED
 */
window.addEventListener('DOMContentLoaded', firstRun)

/**
 * LOAD
 */
window.addEventListener('load', initOnce)
window.addEventListener('load', initRun)

/**
 * SCROLL
 */
window.addEventListener('scroll', throttle(100, getScrollPos), false)

/**
 * RESIZE
 */
window.addEventListener('resize', debounce(50, resize), false)
