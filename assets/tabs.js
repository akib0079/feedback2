import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';

class Tabs extends Component {
    #activeItem = null;
    #activeContent = null;

    connectedCallback() {
        this.initTabs();
        this.initShopifyEvents();
    }

    initTabs() {
        this.querySelectorAll('.tab-item__header').forEach((header, i) => {
            if (i == 0) this.activeItem(header);
            header.addEventListener('click', (e) => {
                e.preventDefault();
                this.activeItem(header);
            });
        });
    }

    initShopifyEvents() {
        document.addEventListener('shopify:block:select', (e) => {
            // Find the tab content that contains the selected block (direct or nested)
            const content = this.querySelector(`.tab-item__content:has([id="${e.detail.blockId}"]), .tab-item__content[data-anchor="${e.detail.blockId}"]`);
            if (!content) return;
            const header = this.querySelector(`.tab-item__header[data-anchor="${content.dataset.anchor}"]`);
            this.activeItem(header);
        });

        document.addEventListener('shopify:block:deselect', (e) => {
            const content = this.querySelector(`.tab-item__content:has([id="${e.detail.blockId}"]), .tab-item__content[data-anchor="${e.detail.blockId}"]`);
            if (!content) return;
            const firstHeader = this.querySelector('.tab-item__header');
            this.activeItem(firstHeader);
        });
    }

    getContent(header) {
        return this.querySelector(`.tab-item__content[data-anchor="${header.dataset.anchor}"]`);
    }

    activeItem(header) {
        if (header === null) return;
        const content = this.getContent(header);
        if (content) {
            if (this.#activeItem) this.#activeItem.classList.remove('active');
            if (this.#activeContent) this.#activeContent.classList.remove('active');
            this.#activeItem = header;
            this.#activeContent = content;
            if (this.#activeItem) this.#activeItem.classList.add('active');
            if (this.#activeContent) this.#activeContent.classList.add('active');
        }
    }
}

if (!customElements.get('tabs-element')) {
  customElements.define('tabs-element', Tabs);
}