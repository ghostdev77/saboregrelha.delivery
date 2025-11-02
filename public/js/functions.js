    document.addEventListener('DOMContentLoaded', function () {
        const params = new URLSearchParams(window.location.search);
        const googleData = JSON.parse(localStorage.getItem('google')) || {};
    
        params.forEach((value, key) => {
            googleData[key] = value;
        });
    
        if (!googleData.utm_source) {
            googleData.utm_source = 'organic';
        }
    
        localStorage.setItem('google', JSON.stringify(googleData));
        console.log('Google Data Atualizado:', googleData);
    
        const newParams = Object.entries(googleData)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    
        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = `${baseUrl}?${newParams}`;
    
        if (window.location.href !== newUrl) {
            window.history.replaceState(null, '', newUrl);
        }
    });
$(document).ready(function() {
    $(document).on('click', 'a.link-to-up', function (e) {
        e.preventDefault();         
        const $this = $(this);
        $this.blur();         

        $('html, body').animate({ scrollTop: 0 }, 600, function () {
            const $main = $('main');
            if ($main.length) {
                $main.attr('tabindex', '-1').focus();
            } else {
                $('[tabindex], a, button, input').first().focus();
            }
        });
    });

    $('#observacoes').on('input', function() {
        const tamanho = $(this).val().length;
        $('#contador').text(tamanho);
    });

    $(document).on('click', 'button.qtd-plus, button.qtd-minus', function (e) {
        e.preventDefault();
        const $container = $(this).closest('.quantity-seletor');
        const $input = $container.find('#qtd');

        let current_qty = parseInt($input.val()) || 1;
        const isPlus = $(this).hasClass('qtd-plus');
        let new_qty = isPlus ? current_qty + 1 : current_qty - 1;
        if (new_qty <= 1){
            new_qty = 1;
            $('button.qtd-minus').attr('disabled', true);
        }else{
            $('button.qtd-minus').attr('disabled', false);
        }

        $input.val(new_qty).trigger('change');

        const total = $('#amount').val() * $input.val();
        $('#subtotal').text(( Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
    });

    $(document).on('click', 'button.qtd-plus-item, button.qtd-minus-item', function (e) {
        e.preventDefault();

        const adicional = $(this).closest('.adicionais');
        const limite = adicional.data('limite');
        const titleAdicional = adicional.prev('.title-adicional');

        const $container = $(this).closest('.seletor-adicional');
        const $input = $container.find('.qtd');

        let current_qty = parseInt($input.val()) || 0;
        const isPlus = $(this).hasClass('qtd-plus-item');
        let new_qty = isPlus ? current_qty + 1 : current_qty - 1;
        if (new_qty < 0) new_qty = 0;

        let totalAtual = 0;
        adicional.find('.qtd').each(function () {
            totalAtual += parseInt($(this).val()) || 0;
        });

        if (isPlus && totalAtual >= limite) {
            return;
        }

        $input.val(new_qty).trigger('change');

        adicional.find('.option-item').each(function () {
            const qtd = parseInt($(this).find('.qtd').val()) || 0;
            $(this).toggleClass('selected', qtd > 0);
        });

        let total = 0;
        adicional.find('.qtd').each(function () {
            total += parseInt($(this).val()) || 0;
        });

        titleAdicional.find('.count span').text(total);

        if (total >= limite) {
            adicional.find('.option-item').not('.selected').addClass('disabled');
            adicional.addClass('completed');
            titleAdicional.find('.contador').addClass('d-none');
            titleAdicional.find('.check-options').removeClass('d-none');

            const $next = adicional.nextAll('.adicionais').first();
            if ($next.length) {
                const headerOffset = 80;
                $('html, body').animate({
                    scrollTop: Math.max(0, $next.offset().top - headerOffset)
                }, 600);
            }
        } else {
            adicional.find('.option-item').removeClass('disabled');
            adicional.removeClass('completed');
            titleAdicional.find('.contador').removeClass('d-none');
            titleAdicional.find('.check-options').addClass('d-none');
        }

        checkComplete();
    });

    $(document).on('click', 'button.add-to-cart', function () {
        const adicionais = $('.adicionais');
        let selecionadosObj = {};

        adicionais.find('.option-item.selected').each(function () {
            const titleAdicional = $(this).closest('.adicionais').prev('.title-adicional').data('title');
            const itemTitle = $('h3', this).text();

            if (!selecionadosObj[titleAdicional]) {
                selecionadosObj[titleAdicional] = [];
            }
            selecionadosObj[titleAdicional].push(itemTitle);
        });

        let selecionadosArray = [];
        for (const grupo in selecionadosObj) {
            selecionadosArray.push(`${grupo}: ${selecionadosObj[grupo].join(', ')}`);
        }

        const product_id = $('input#product_id').val();
        const qtd = $('input#qtd').val();
        const observacoes = $('#observacoes').val();
        const opcoes = selecionadosArray;

        $('.loading__circle').css({'display':'flex'});

        $.ajax({
            type: 'POST',
            url: window.rotas.adicionarCarrinho,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            data: { product_id, qtd, observacoes, opcoes },
            success: function(response) {
                if(response.success){
                    sessionStorage.setItem('flashMessage', response.message);
                    window.location.href = window.rotas.cartUrl;
                }
            }
        })
    });

    function checkComplete() {
        let allComplete = true;

        $('.adicionais').each(function () {
            if (!$(this).hasClass('completed')) {
                allComplete = false;
                $('.btn-comprar, .quantity-seletor .qtd-plus, .quantity-seletor .qtd-minus').attr('disabled', true);
                return false;
            }
        });

        if(allComplete){
            $('.btn-comprar, .quantity-seletor .qtd-plus').attr('disabled', false);

        }   
    }
    checkComplete();

    $(document).on('click', 'button.qtd-item-plus, button.qtd-item-minus', function (e) {
        e.preventDefault();
        const $container = $(this).closest('.selector');
        const $input = $container.find('.item-qtd');
        const subTotal = $container.prev('h3.price');

        const produto = $container.closest('.item-cart');

        let current_qty = parseInt($input.val()) || 0;
        const isPlus = $(this).hasClass('qtd-item-plus');
        let new_qty = isPlus ? current_qty + 1 : current_qty - 1;

        if(new_qty == 0){
            produto.remove();
        }

        if (new_qty <= 1){
            $container.find('button.qtd-item-minus .delete-icon').removeClass('d-none');
            $container.find('button.qtd-item-minus .minus-icon').addClass('d-none');
        }else{
            $container.find('button.qtd-item-minus .delete-icon').addClass('d-none');
            $container.find('button.qtd-item-minus .minus-icon').removeClass('d-none');
        }

        $input.val(new_qty).trigger('change');

        const product_id = $container.data('item');

        $.ajax({
            type: 'POST',
            url: window.rotas.updateCarrinho,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            data: { product_id, new_qty},
            success: function(response) {
                if(response.success){
                    if(response.totalCarrinho == '0,00'){
                       window.location.href = window.rotas.homeUrl; 
                    }
                    subTotal.text('R$ '+response.itemSubtotal);
                    $('#totalCart, #totalFinal').text('R$ '+response.totalCarrinho);
                    $('#amount').val(response.number);
                    desmarcarExtras();
                }
            }
        });
    });

    $(document).on('change', '.extra-item', function() {
        const valor = parseFloat($(this).val());
        const amount = parseFloat($('#amount').val());
        let total = 0;

        if ($(this).is(':checked')) {
            total = amount + valor;
        } else {
            total = amount - valor;
        }

        $('#amount').val(total);
        $('#totalCart, #totalFinal').text(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    });

    function desmarcarExtras() {
        $('.extra-item:checked').each(function () {
            $(this).prop('checked', false);
        });
    }

    $(window).on('scroll', function () {
        const $target = $('.total-cart');
        if ($target.length === 0) return;

        const targetBottom = $target.offset().top + $target.outerHeight();
        const scrollTop = $(window).scrollTop();
        const windowHeight = $(window).height();

        if (scrollTop > targetBottom) {
            $('.priceFinal').addClass('d-flex');
        } else {
            $('.priceFinal').removeClass('d-flex');
        }
    });
});