import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';


class ProductMiniCard extends Component {
  /** @type {Array<Object>} */
  #variants = [];
  #product = null;
  #swiper = null;

  /** @type {string|null} */
  #selectedVariantId = null;

  connectedCallback() {
    super.connectedCallback();
    this.#product = this.#parseVariants();
    this.#variants = this.#product.variants;
    this.#selectedVariantId = this.querySelector('[data-pmc-cta]')?.dataset.variantId ?? null;

    if(this.classList.contains('v2')){
      this.updateAvailableState();
      onDocumentLoaded(() => {
          this.#swiper = new Swiper(this.querySelector('.pmc__img-gallery'), {
            slidesPerView: 1
          });  
      });
    }
    else{
      this.querySelectorAll('.pmc__option-selector').forEach((selector) => {
        this.querySelectorAll('.js-option').forEach((opt) => {
          const optionIndex = parseInt(selector.dataset.optionIndex ?? '0', 10) + 1;
           const selectedOptions = {[`option${optionIndex}`] : opt.value};
           
            if (selectedOptions && Object.keys(selectedOptions).length === 0) return;
            const matches = this.#variants.filter(variant => {
                return Object.entries(selectedOptions).every(([key, value]) => variant[key] === value);
            }).sort((a, b) => b.available - a.available);
            if(matches[0]){
                opt.classList.toggle('is-unavailable', !matches[0].available);
            }
        })
        
      }) 
    }
    
    this.#initSizes();
    this.#initCta();
  }

  /* ── Private helpers ──────────────────────────────────────── */

  #parseVariants() {
    try {
      const raw = this.querySelector('.pmc__variants-data')?.textContent;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  #getSelectedOptions() {
    const selectors = this.querySelectorAll('.pmc__option-selector');
    const values = {};
    
    selectors.forEach((selector) => {
        const checked = selector.querySelector('.js-option:checked');
        if(checked){
            const optionIndex = parseInt(selector.dataset.optionIndex ?? '0', 10) + 1;
           values['option' + optionIndex]  = checked.value
        }
    });

    return values;
}

  #initSizes() {
    const container = this.querySelector('[data-pmc-sizes]');
    if (!container) return;

    const optionIndex = parseInt(container.dataset.optionIndex ?? '0', 10);
    const cta = this.querySelector('[data-pmc-cta]')
    if (cta) {
    container.querySelectorAll('.pmc__opt-label').forEach(label => {
      const opt = this.querySelector('#' + label.htmlFor)
      if(opt){
        label.addEventListener('mouseover', () => {
          opt.checked = true;

          
          opt.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    })
    container.addEventListener('change', (e) => {
        if (!e.target.classList.contains('js-option')) return;

        if(this.classList.contains('v2')){
          this.updateAvailableState();
          this.querySelectorAll('.pmc__option-selector').forEach(selector => {
            if(selector.querySelector('.js-option:checked').classList.contains('is-unavailable')){
              selector.querySelector('.js-option:not(is-unavailable)').checked = true;
            }
          })
          
        }

        const selectedOptions = this.#getSelectedOptions();
        if (selectedOptions && Object.keys(selectedOptions).length === 0) return;
        const matches = this.#variants.filter(variant => {
            return Object.entries(selectedOptions).every(([key, value]) => variant[key] === value);
        }).sort((a, b) => b.available - a.available);
        if(matches[0]){
            this.#selectedVariantId = matches[0].id;
            cta.classList.toggle('is-unavailable', !matches[0].available);
            cta.dataset.variantId = this.#selectedVariantId;
            if(this.#swiper){
              const slideIndex = [...this.#swiper.slides].findIndex( 
                slide => {
                  return slide.dataset.mediaId == matches[0].featured_image.id
                }
              );
              if(slideIndex != -1)
              this.#swiper.slideTo(slideIndex)
            }
        }
        
    });
    
    }  
  }
  updateAvailableState(productData = this.#product) {
        const optionStatusMap = [];
        const currentSelectedOptionValues = [];

        // Collect current selected option values
        this
        .querySelectorAll('.pmc__option-selector')
        .forEach((selector) => {
            const checkedInput = selector.querySelector('input:checked');
            let value = null;
            if (checkedInput) {
            value = checkedInput.value;
            }

            currentSelectedOptionValues.push(value);
        });
        // Build option value map
        productData.options.forEach((optionName, optionIndex) => {
        const values = {};

        productData.variants.forEach((variant) => {
            const optionValue = variant.options[optionIndex];
            if (!(optionValue in values)) {
            values[optionValue] = false;
            }
        });

        optionStatusMap.push({
            name: optionName,
            values,
        });
        });

        // Determine availability per option value
        productData.options.forEach((optionName, optionIndex) => {
        const fixedOptions = currentSelectedOptionValues.slice(0, optionIndex);

        Object.keys(optionStatusMap[optionIndex].values).forEach((optionValue) => {
            const fixedOptionsForValue = [...fixedOptions, optionValue];

            let availableVariantExists = false;

            productData.variants.forEach((variant) => {
            let variantComplies = true;

            fixedOptionsForValue.forEach((fixedValue, idx) => {
                if (fixedValue && fixedValue != variant.options[idx]) {
                variantComplies = false;
                }
            });

            if (variantComplies && variant.available) {
                availableVariantExists = true;
            }
            });

            optionStatusMap[optionIndex].values[optionValue] = availableVariantExists;
        });
        });
        // Apply unavailable state to UI
        optionStatusMap.forEach((option, optionIndex) => {
        let available = false;
        Object.entries(option.values).forEach(([optionValue, isAvailable]) => {
            // Listed (radio / swatch)
            available = available || isAvailable;
            this
            .querySelectorAll(`.pmc__option-selector[data-option-index="${optionIndex}"] .pmc__opt-btn`)
            .forEach((btn) => {
                if (btn.value === optionValue) {
                btn.classList.toggle('is-unavailable', !isAvailable);
                }
            });
        });
        this
            .querySelector(`.pmc__option-selector[data-option-index="${optionIndex}"]`)
            ?.classList.toggle('is-unavailable', !available);
        });
    }

  #initCta() {
    const cta = this.querySelector('[data-pmc-cta]');
    if (!cta) return;

    cta.addEventListener('click', async (e) => {
        e.preventDefault();
      const variantId = cta.dataset.variantId;
      if (!variantId || cta.classList.contains('btn--in-progress')) return;

      // If product has sizes and none selected, pulse the size row
      const sizeContainer = this.querySelector('[data-pmc-sizes]');
      if (sizeContainer && cta.classList.contains('is-unavailable')) {
        this.#pulseSizes(sizeContainer);
        return;
      }

      await this.#addToCart(variantId, cta);
    });
  }

  async #addToCart(variantId, ctaBtn) {
    ctaBtn.classList.add('btn--in-progress');

    try {
      const response = await fetch(window.Theme?.routes?.cart_add_url ?? '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
      });

      const data = await response.json();

      ctaBtn.classList.remove('btn--in-progress');

      if (!response.ok || data.status) {
        // Error — show popup if available
        const msg = data.description ?? data.message ?? 'Could not add to cart';
        window.Theme?.showQuickPopup?.(msg, ctaBtn);
        return;
      }

      // Success
      ctaBtn.classList.add('check');
      setTimeout(() => ctaBtn.classList.remove('check'), 2000);

      // Fire cart events so header/cart drawer update
      document.dispatchEvent(
        new CustomEvent('Theme:cartchanged', { bubbles: true, cancelable: false })
      );

      // CartAddEvent — optional, only if Theme events are available
      document.dispatchEvent(
        new CartAddEvent(null, null, {
            source: 'complete-your-look',
            variantId: variantId,
        })
    );

      window.Theme?.showQuickPopup?.('Added to cart', ctaBtn);
    } catch (err) {
      ctaBtn.classList.remove('btn--in-progress');
      console.error('[ProductMiniCard] add-to-cart error:', err);
    }
  }

  /** Briefly animate the size row to draw attention */
  #pulseSizes(container) {
    container.animate(
      [
        { outline: '2px solid transparent' },
        { outline: '2px solid #F5A623' },
        { outline: '2px solid transparent' },
      ],
      { duration: 600, easing: 'ease-in-out' }
    );
  }
}

if (!customElements.get('product-mini-card')) {
  customElements.define('product-mini-card', ProductMiniCard);
}