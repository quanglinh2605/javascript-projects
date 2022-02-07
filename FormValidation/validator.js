// Đối tượng validator
function Validator(options) {

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};
    var formElement = document.querySelector(options.form);
    function validate (inputElement, rule) {
        var errorMessage;
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var rules = selectorRules[rule.selector];
        for(var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](formElement.querySelector(rule.selector + ':checked'));
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }

        if (errorMessage) {
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
            errorElement.innerText = errorMessage;
        } else {
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
            errorElement.innerText = '';
        }
        return !!errorMessage;
    }

    if (formElement) {
        formElement.onsubmit = function (e) {
            e.preventDefault();
    
            var isFormValid = true;
    
            // Lặp qua từng rules và validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (isValid) {
                    isFormValid = false;
                }
            });
            
            if (isFormValid) {
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]');
                    var formValues = Array.from(enableInputs).reduce(function (values, input){
                        if (input.type == 'checkbox' && input.matches(':checked')) {
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                        } else if (input.matches(':checked')) {
                            values[input.name] = input.value;
                        } else if (input.type == 'file') {
                            values[input.name] = input.files;
                        }
                        if (!values[input.name]) {
                            values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    options.onSubmit(formValues);
                } else {
                    formElement.submit();
                }
            }
        }

        options.rules.forEach(function (rule) {
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }
            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function (inputElement) {
                if (inputElement) {
                    inputElement.onblur = function () {
                        validate(inputElement, rule);
                    }
                    // Handle every time the user enters input
                    inputElement.oninput = function () {
                        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                        errorElement.innerText = '';
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                    }
                }
            }); 
        });
    }
}

// Định nghĩa rules
// Nguyên tắc của các rules:
// 1. Khi có lỗi => Trả ra message lỗi
// 2. Khi hợp lệ => Không trả ra cái gì cả (undefined)
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function(value) {
            if (value == null) {
                value = '';
            }
            return value ? undefined : message || 'Vui long nhap vao truong nay';
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Truong nay phai la email';
        }
    }
}

Validator.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : message || 'Vui long nhap toi thieu ' + min + ' ki tu'
        }
    }
}

Validator.isConfirmed = function (selector, getValueConfirm, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getValueConfirm() ? undefined : message || 'Mat khau nhap lai khong chinh xac';
        }
    }
}