import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';

class DisclosureElement extends Component {
  constructor() {
    super();
    this._onBodyClick = this._onBodyClick.bind(this);
  }

  connectedCallback() {
    this.list    = this.querySelector('[data-disclosure-list]');
    this.toggle  = this.querySelector('[data-disclosure-toggle]');
    this.input   = this.querySelector('[data-disclosure-input]');
    this.options = this.querySelectorAll('[data-disclosure-option]');

    this.toggle.addEventListener('click',   this._onToggleClick.bind(this));
    this.toggle.addEventListener('focusout', this._onToggleFocusOut.bind(this));
    this.list.addEventListener('focusout',   this._onListFocusOut.bind(this));
    this.addEventListener('keyup',           this._onKeyUp.bind(this));
    document.body.addEventListener('click',  this._onBodyClick);

    this.options.forEach(opt => {
      opt.addEventListener('click', this._onOptionClick.bind(this));
    });
  }

  disconnectedCallback() {
    document.body.removeEventListener('click', this._onBodyClick);
  }

  _onToggleClick(e) {
    const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
    e.currentTarget.setAttribute('aria-expanded', String(!expanded));
    this.list.classList.toggle('disclosure-list--visible');
  }

  _onOptionClick(e) {
    e.preventDefault();
    this._submitForm(e.currentTarget.dataset.value);
  }

  _onToggleFocusOut(e) {
    if (!this.contains(e.relatedTarget)) this._hideList();
  }

  _onListFocusOut(e) {
    const childInFocus = this.list.contains(e.relatedTarget);
    const isVisible    = this.list.classList.contains('disclosure-list--visible');
    if (isVisible && !childInFocus) this._hideList();
  }

  _onKeyUp(e) {
    if (e.key !== 'Escape') return;
    this._hideList();
    this.toggle.focus();
  }

  _onBodyClick(e) {
    const isInside  = this.contains(e.target);
    const isVisible = this.list.classList.contains('disclosure-list--visible');
    if (isVisible && !isInside) this._hideList();
  }

  _submitForm(value) {
    if (this.input) this.input.value = value;
    this.closest('form')?.submit();
  }

  _hideList() {
    this.list.classList.remove('disclosure-list--visible');
    this.toggle.setAttribute('aria-expanded', 'false');
  }
}
if (!customElements.get('disclosure-element')) {
  customElements.define('disclosure-element', DisclosureElement);
}
