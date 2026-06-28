import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';

class FAQAccordion extends Component {
  connectedCallback() {
    this.el = this.querySelector('.custom-accordion__item');
    this.summary = this.querySelector('summary');
    this.content = this.querySelector('.custom-accordion__content');
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    this.summary.addEventListener('click', (e) => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault();
    this.el.style.overflow = 'hidden';
    if (this.isClosing || !this.el.hasAttribute('open')) {
      this.open();
    } else if (this.isExpanding || this.el.hasAttribute('open')) {
      this.shrink();
    }
  }

  shrink() {
    this.isClosing = true;
    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight}px`;
    if (this.animation) this.animation.cancel();
    this.animation = this.el.animate({
      height: [startHeight, endHeight]
    }, {
      duration: 300,
      easing: 'ease-out'
    });
    this.animation.onfinish = () => this.onAnimationFinish(false);
    this.animation.oncancel = () => this.isClosing = false;
  }

  open() {
    this.el.style.height = `${this.el.offsetHeight}px`;
    this.el.setAttribute('open', '');
    window.requestAnimationFrame(() => {
      this.isExpanding = true;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;
      if (this.animation) this.animation.cancel();
      this.animation = this.el.animate({
        height: [startHeight, endHeight]
      }, {
        duration: 300,
        easing: 'ease-out'
      });
      this.animation.onfinish = () => this.onAnimationFinish(true);
      this.animation.oncancel = () => this.isExpanding = false;
    });
  }

  onAnimationFinish(open) {
    if (open) {
      this.el.setAttribute('open', '');
    } else {
      this.el.removeAttribute('open');
    }
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    this.el.style.height = this.el.style.overflow = '';
  }
}

if (!customElements.get('accordion-item')) {
  customElements.define('accordion-item', FAQAccordion);
}