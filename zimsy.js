Zimsy.elements = [];

function Zimsy(options) {
    this.opt = Object.assign({
        destroyOnClose: true,
        closeMethods: ['button', 'overlay', 'escape'],
        classList: [],
        footer: false,
    }, options);
    this.template = document.querySelector(`#${this.opt.templateId}`);
    if (!this.template) return console.error(`#${this.opt.templateId} does not exist`);

    const {closeMethods} = this.opt;
    
    this._allowBackdropClose = closeMethods.includes('overlay');
    this._allowButtonClose = closeMethods.includes('button');
    this._allowEscapeClose = closeMethods.includes('escape');
    
    this._footerButtons = [];

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

Zimsy.prototype._getScrollbarWidth = function() {
    if (this._scrollbarWidth) return this._scrollbarWidth;
    const div = document.createElement('div');
    Object.assign(div.style, {
        overflow: 'scroll',
        position: 'absolute',
        top: '-999px',
    });
    document.body.appendChild(div);
    this._scrollbarWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);
    return this._scrollbarWidth;
}

Zimsy.prototype._renderFooterContent = function() {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }
}

Zimsy.prototype.setFooterContent = function(html) {
    this._footerContent = html;
    this._renderFooterContent();
}

Zimsy.prototype.addFooterButton = function(title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);
    this._footerButtons.push(button);
    this._renderFooterButtons();
}

Zimsy.prototype._createButton = function(title, cssClass, callback) {
    const button = document.createElement('button');
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = (e) => callback(e);
    return button;
}

Zimsy.prototype._renderFooterButtons = function() {
    if (this._modalFooter) {
        this._footerButtons.forEach((button) => {
            this._modalFooter.append(button);
        })
    }
}

Zimsy.prototype._build = function() {
    const content = this.template.content.cloneNode(true);

    // Create element
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'zimsy__backdrop';
    
    const container = document.createElement('div');
    container.className = 'zimsy__container';
    // Adding class
    this.opt.classList.forEach((className) => {
        if (typeof className === 'string') {
            container.classList.add(className);
        }
    })
    
    const modalContent = document.createElement('div');
    modalContent.className = 'zimsy__content';

    modalContent.append(content);
    container.append(modalContent);

    if (this.opt.footer) {
        this._modalFooter = document.createElement('footer');
        this._modalFooter.className = 'zimsy__footer';

        this._renderFooterContent();
        this._renderFooterButtons();

        container.append(this._modalFooter);
    }

    if (this._allowButtonClose) {
        const closeBtn = this._createButton('&times', 'zimsy__close', () => this.close());
        container.append(closeBtn);
    }

    // Append content and elements
    this._backdrop.append(container);
    document.body.append(this._backdrop);
}

Zimsy.prototype.open = function() {
    Zimsy.elements.push(this);

    if (!this._backdrop) this._build();

    setTimeout(() => {
        this._backdrop.classList.add('zimsy--show');
    }, 0)

    // Event listeners
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        }
    }

    if (this._allowEscapeClose && this._backdrop) {
        document.addEventListener('keydown', this._handleEscapeKey)
    }

    // Disable scrolling
    document.body.classList.add('zimsy--no-scroll');
    document.body.style.paddingRight = this._getScrollbarWidth() + 'px';

    // On Open funtion
    this._onTransitionEnd(this.opt.onOpen);

    return this._backdrop;
}

Zimsy.prototype.close = function(destroy = this.opt.destroyOnClose) {
    Zimsy.elements.pop();
    this._backdrop.classList.remove('zimsy--show');
    this._onTransitionEnd(()=> {
        if (destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        }
        
        if (Zimsy.elements.length === 0) {
            document.body.classList.remove('zimsy--no-scroll');
            document.body.style.paddingRight = '';
        }
    })
    if (this._allowEscapeClose) {
        document.removeEventListener('keydown', this._handleEscapeKey)
    }
    if (typeof this.opt.onClose === 'function') {
        this.opt.onClose();
    }
}

Zimsy.prototype.destroy = function() {
    this.close(true);
}

Zimsy.prototype._handleEscapeKey = function(e) {
    const lastModal = Zimsy.elements[Zimsy.elements.length - 1];
    if (e.key === 'Escape' && this === lastModal) this.close();
}

Zimsy.prototype._onTransitionEnd = function(callback) {
    this._backdrop.ontransitionend = (e) => {
        if (typeof callback === 'function' && e.propertyName === 'transform') {
            callback();
        }
    }
}