let cart = {};
document.querySelectorAll('.add-to-cart').forEach(element => {
    element.onclick = addToCart;
});

if(localStorage.getItem('cart')){
    cart = JSON.parse(localStorage.getItem('cart'));
    ajaxGetGoodsInfo();
};

function addToCart(){
    let goodsId = this.dataset.goods_id;
    if(cart[goodsId]){ //Если такое значение существует то увеличивем количество данного товара на еденицу
        cart[goodsId]++;
    }else{ //Если такого значение не существует то мы его добавляем, приравнивая еденицу
        cart[goodsId] = 1;
    }
    console.log(cart);
    ajaxGetGoodsInfo();
};

function ajaxGetGoodsInfo(){ //Делаем POST запрос на сервер и вытаскиваем товары id которых находиться в корзине
    updateLocalStorageCart();
    fetch('/get-goods-info', {
        method: 'POST',
        body: JSON.stringify({key: Object.keys(cart)}), //Позволяет в нутрь POST запроса запаковать данные которые мы отправим на сервер. Object.keys(cart) - возвращает ключи массива в возрастающем порядке
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        } //Служит для того чтобы правильно отправить строку JSON, уведамляем сервер в каком формате мы будем работать
    }).then(response => {
        return response.text(); //Возвращает массив объектов, в том числе и body
    }).then(body => { //Извелкаем body 
        showCart(JSON.parse(body));
    })
};

function showCart(data){//Функция формирует таблицу с выбранным товаром и добавляет её на страницу
    let out = '<table class="table table-striped table-cart"><tbody>'
    let total = 0;
    for(let key in cart){
       out += `<tr><td colspan="4"><a href="/goods?id=${key}">${data[key]['name']}</a></tr>`; 
       out += `<tr><td><i class="far fa-minus-square cart-minus" data-goods_id="${key}"></i></td>`;
       out += `<td>${cart[key]}</td>`;
       out += `<td><i class="far fa-plus-square cart-plus" data-goods_id="${key}"></i></td>`;
       out += `<td>${formatPrice(data[key]['cost']*cart[key])} uah </td>`;
       out += '</tr>';
       total += cart[key]*data[key]['cost'];
    }
    out += `<tr><td colspan="3">Total: </td><td>${formatPrice(total)} uah</td></tr>`;
    out += '</tbody></table>';
    document.querySelector('#cart-nav').innerHTML = out;
    document.querySelectorAll('.cart-minus').forEach(element => {
        element.onclick = cartMinus;
    });
    document.querySelectorAll('.cart-plus').forEach(element => {
        element.onclick = cartPlus;
    });
};

function cartPlus(){
    let goodsId = this.dataset.goods_id;
    cart[goodsId]++;
    ajaxGetGoodsInfo();
}

function cartMinus(){
    let goodsId = this.dataset.goods_id;
    ajaxGetGoodsInfo();
    if(cart[goodsId] -1 > 0){
        cart[goodsId]--;
    }else{
        delete(cart[goodsId]);
    };
    ajaxGetGoodsInfo(); //Обнавляем данные делая запрос на сервер
}

function updateLocalStorageCart(){
    localStorage.setItem('cart', JSON.stringify(cart));
}

function formatPrice(price){
    return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
};