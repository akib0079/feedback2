import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';

class HeaderMegamenu extends Component {
    #open = false;
    #debounce = false;
    #debounceTime = 300;
    #anchors;
    connectedCallback() {
        super.connectedCallback();
        this.init();
    }
    init(){
        // onDocumentLoaded(() => {
        // });
        
        this.initAnchors();
        this.initTabs();
    }

    initAnchors(){
        this.#anchors = document.querySelectorAll(`[data-megemenu-id=${this.id}]`)
        this.#anchors.forEach(element => {
            element.addEventListener('click', e=>{
                e.preventDefault();
                this.toggle()
            })
            element.addEventListener('mouseenter', e=>{
                this.open()
            })
        });
        this.addEventListener('blur', () => {
            if (window.matchMedia("(pointer: fine) and (hover: hover)").matches)
            this.close();
        })
        this.addEventListener('shopify:block:select', this.#handleBlockSelect);
        this.addEventListener('shopify:block:deselect', this.#handleBlockDeselect);
        this.querySelectorAll('.header-megamenu__back').forEach(element => {
            element.addEventListener('click', e=>{
                e.preventDefault();
                this.close()
            })
        });
    }
    #handleBlockSelect(e){
        document.querySelector(`header-megamenu:not([id="${this.id}"]).admin-active`)?.classList.remove('admin-active');
        this.classList.add('admin-active');
    }
    #handleBlockDeselect(){
        this.classList.remove('admin-active');
    }
    #debouncer(){
        this.#debounce = true;
        setTimeout(() => {
            this.#debounce = false;
        }, this.#debounceTime);
    }
    open(){
        if(this.#open || this.#debounce) return;
        this.#debouncer();
        document.querySelector(`header-megamenu:not([id="${this.id}"]).active`)?.close();
        this.classList.add('active');
        this.#open = true;
        setTimeout(() => {
            this.focus();
        }, 300);
        this.#anchors.forEach(element => {
            element.classList.add('active');
        })
        document.body.classList.add('megamenu-active');
    }
    close(){
        if(!this.#open || this.#debounce) return;
        this.#debouncer();
        this.classList.remove('active');
        this.#open = false;
        this.#anchors.forEach(element => {
            element.classList.remove('active');
        })
        document.body.classList.remove('megamenu-active');
    }
    forceClose(){
        this.classList.remove('active');
        this.#open = false;
        this.#anchors.forEach(element => {
            element.classList.remove('active');
        })
        document.body.classList.remove('megamenu-active');
    }
    toggle(){
        if(this.classList.contains('active')) this.close()
        else this.open()
    }
    initTabs(){
        const tabWrap = this.querySelector('.header-megamenu__tab_contents');
        this.querySelector('.header__megeamenu__tab-head').classList.add('active')
        const firstTab = this.querySelector('.header__megeamenu__tab-content');
        firstTab.classList.add('active')
        tabWrap.style.setProperty('--height', firstTab.scrollHeight + 'px');
        this.querySelectorAll('.header__megeamenu__tab-head').forEach(head => {
            const id = head.dataset.tabId;
            const tab = this.querySelector(`.header__megeamenu__tab-content#${id}`);
            if(tab){
                head.addEventListener('click', e => {
                    e.preventDefault();
                })
                head.addEventListener('mouseenter', e => {
                        this.querySelector('.header__megeamenu__tab-head.active')?.classList.remove('active');
                    if(document.documentElement.classList.contains('shopify-design-mode')){
                        this.querySelector('.header__megeamenu__tab-content.admin-active')?.classList.remove('admin-active');
                        tab.classList.add('admin-active')
                    }
                    else{
                        this.querySelector('.header__megeamenu__tab-content.active')?.classList.remove('active');
                        tab.classList.add('active')
                    }
                    head.classList.add('active')
                    tabWrap.style.setProperty('--height', tab.scrollHeight + 'px');
                    
                })
                tab.addEventListener('shopify:block:select', (e)=>{
                    // e.stopPropagation();
                    tab.classList.add('admin-active')
                    tabWrap.style.setProperty('--height', tab.scrollHeight + 'px');
                });
                tab.addEventListener('shopify:block:deselect', (e)=>{
                    // e.stopPropagation();
                    tab.classList.remove('admin-active')
                });
            }
        })
    }
}
if (!customElements.get('header-megamenu')) {
  customElements.define('header-megamenu', HeaderMegamenu);
}