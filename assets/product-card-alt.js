import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';

class ProductCardAlt extends Component {
    #slider = null;
    #product = null;
    connectedCallback() {
        super.connectedCallback();
        this.init();
    }
    init(){
        this.#product = JSON.parse(this.querySelector('script[type="application/json"].prod-data').textContent);
        onDocumentLoaded(() => {
            this.initSlider(); 
            this.initSwatches(); 
            this.initAjaxCart(); 
            this.updateAvailability(); 
        });
        // if(this.classList.contains('globo-template-product')){
        //     this.fetchReviews();
        // }
    }
    async fetchReviews(){
        const id = this.dataset.productId;
        if(id){
            const url = `https://api.judge.me/api/v1/widgets/preview_badge?api_token=DKyluAuaeKXc_lFDdw0vzHh_7Rs&shop_domain=kampeerwinkelecomm.myshopify.com&external_id=${id}`;
            try {
                const res = await fetch(url);
                const data = await res.json();
                // this.querySelector('.product-card__alt_price-wrapper').insertAdjacentHTML('beforeend', data.badge)

                // 1. Initialize the parser
                const parser = new DOMParser();

                // 2. Parse the string into an HTML document
                const doc = parser.parseFromString(data.badge, 'text/html');
                const badge = doc.querySelector('.jdgm-prev-badge')
                if(badge.dataset.averageRating && badge.dataset.averageRating != '0.00'){
                    badge.querySelector('.jdgm-prev-badge__text').innerHTML = `<span> ${Number(badge.dataset.averageRating)}</span> <span>${ badge.dataset.numberOfReviews }</span><span> reviews </span>`;
                    console.log(badge); // Outputs: Hello World
                    this.querySelector('.product-card__alt_price-wrapper').append(badge)
                }
                
            } catch (e) {
                console.log(e)
                return null;
            }
        }
    }
    initSlider(){
        this.#slider = new Swiper(this.querySelector('.product-card__alt-gallery'), {
            slidesPerView: 'auto',
        });
        
        const slideIndex = this.getSelectedSlideIndex();
        if (slideIndex !== -1)
        this.#slider.slideTo(slideIndex);

        this.addEventListener('variant_changed', (e) => {
            
            const slideIndex = this.getSelectedSlideIndex();

            if (slideIndex === -1) return;

            this.#slider.slideTo(slideIndex);
        })
    }
    initSwatches(){
        this.addEventListener('change', (e) => {
            if (!e.target.classList.contains('js-option')) return;

            const selectedOptions = this.getSelectedOptions();
            // if not all options selected yet, bail
            if (selectedOptions.includes(null)) return;
            const variant = this.findVariantByOptions(
                selectedOptions
            );
            if (!variant) return;
            this.dispatchEvent(
                new CustomEvent('variant_changed', {
                detail: {
                    variantId: variant,
                    options: selectedOptions
                }
                })
            );
            this.updateAvailability()
        });
        this.querySelectorAll('.option-selector--secondary .product-card__alt_opt-label').forEach(opt => {
            opt.addEventListener('click', (e)=>{
                setTimeout(()=>{    
                    this.querySelector('.product-card__alt_floating-action-button').click();
                    opt.classList.add('btn--in-progress');
                },0)
            })
        })
        this.addEventListener('product-card:completedAjax', () => {
            this.querySelector('.product-card__alt_opt-label.btn--in-progress')?.classList.remove('btn--in-progress');
            if(this.classList.contains('size-visible'))this.classList.remove('size-visible')
        })
    }
    initAjaxCart(){
        const btn = this.querySelector('.product-card__alt_floating-action-button');
        if(!btn) return;
        this.addEventListener('variant_changed', (e) => {
            const { variantId } = e.detail;
            btn.dataset.variantId = variantId;
        })
        if(this.querySelector('.option-selector--secondary .product-card__alt_opt-label')){
            this.querySelector('.product-card__alt_floating-buttons').addEventListener('blur', () => {
                if(this.classList.contains('size-visible')){
                    this.classList.remove('size-visible');
                }
            })
            
        }
        const evt = new CustomEvent('product-card:completedAjax', { bubbles: true, cancelable: false })
        btn.addEventListener('click', e=>{
            e.preventDefault();
            if(this.querySelector('.option-selector--secondary .product-card__alt_opt-label')){
                if(!this.classList.contains('size-visible')){
                    this.classList.add('size-visible');
                    this.querySelector('.product-card__alt_floating-buttons').focus();
                    return;
                }
            }
            btn.classList.add('btn--in-progress');
            fetch(Theme.routes.cart_add_url, {
                method: 'POST',
                body: JSON.stringify({
                    items: [
                    {
                    id: btn.dataset.variantId,
                    quantity: 1
                    }]

                }),
                headers: {
                    "Content-Type": "application/json"
                }
            }).
            then((response) => {
                btn.classList.remove('btn--in-progress');
                return response.json();
            }).
            then((response) => {
                this.dispatchEvent(
                    new CustomEvent('product-card:completedAjax', { bubbles: true, cancelable: false })
                );
                if (!response.status || response.status === 200) {
                    document.dispatchEvent(
                        new CustomEvent('Theme:cartchanged', { bubbles: true, cancelable: false })
                    );
                    document.dispatchEvent(
                        new CartAddEvent(null, null, {
                            source: 'quick-add',
                            variantId: btn.dataset.variantId,
                        })
                    );
                    btn.classList.add('check');
                    setTimeout(() => {
                    btn.classList.remove('check');
                    }, 1500)
                    // Theme.showQuickPopup("Added to cart", btn);
                } else if (response.description) {
                    Theme.showQuickPopup(response.description, btn);
                }
            });
        })
    }
    getSelectedOptions() {
        const selectors = this.querySelectorAll('.product-card__alt_option-selector');
        const values = [];

        selectors.forEach((selector) => {
            const checked = selector.querySelector('.js-option:checked');
            values.push(checked ? {"position": checked.dataset.position, "value": checked.value} : null);
        });

        return values;
    }
    findVariantByOptions(options) {
        // const selector = options
        // .map(o => `[option-${o.position}="${CSS.escape(o.value)}"]`)=;
        // // this.#product.variants.find(v => v.option1 === swatchValue && v.option2 === opt.dataset.optionItem);
        // console.log(this.findBestVariantByArrayCriteria(this.#product.variants, options))
        return this.findBestVariantByArrayCriteria(this.#product.variants, options).id;
    }
    findBestVariantByArrayCriteria(variantsArray, criteriaArray) {
        // 1. Convert [{position: "2", value: "S"}] into {option2: "S"}
        const criteriaObj = criteriaArray.reduce((acc, item) => {
            acc[`option${item.position}`] = item.value;
            return acc;
        }, {});

        // 2. Filter variants that match all the properties in the criteria object
        const matches = variantsArray.filter(variant => {
            return Object.entries(criteriaObj).every(([key, value]) => variant[key] === value);
        });

        // 3. Sort so available: true comes first (1 - 0 = positive moves true up)
        matches.sort((a, b) => b.available - a.available);

        // 4. Return the best match or null if none
        return matches[0] || null;
    }
    getSelectedSlideIndex(){
        const mediaId = this.querySelector('.option-selector--swatch .js-option:checked')?.dataset.mediaId;
        return mediaId? [...this.#slider.slides].findIndex(
                slide => slide.dataset.mediaId == mediaId
            ) : -1;
    }
    updateAvailability(){
      const swatchValue = this.querySelector('.product-card__alt_option-selector.option-selector--swatch .product-card__alt_opt-btn:checked')?.value;
      if(!swatchValue) return;
      this.querySelectorAll('.product-card__alt_option-selector:not(.option-selector--swatch) .product-card__alt_opt-btn').forEach(opt => {
        const v = this.#product.variants.find(v => v.option1 === swatchValue && v.option2 === opt.value);
        if(!v) return;
        opt.classList.toggle('is-unavailable', !(v.available))
      });
      this.querySelectorAll('.product-card__alt_floating-buttons').forEach(optBlock => {
        optBlock.classList.toggle('is-unavailable',optBlock.querySelector('.product-card__alt_opt-btn:not(.is-unavailable)') === null)
      });
    }
}
if (!customElements.get('product-card-alt')) {
  customElements.define('product-card-alt', ProductCardAlt);
}