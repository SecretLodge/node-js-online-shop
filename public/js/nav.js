document.querySelector('.close-nav').onclick = closeNav;
document.querySelector('.show-nav').onclick = showNav;

function closeNav(){
    document.querySelector('.site-nav').style.left = '-300px';
}
function showNav(){
    document.querySelector('.site-nav').style.left = '0';
}

function getCategoryList(){
    fetch('/get-category-list', 
    {
        method: 'POST'
    } //1 - URL адресс на который мы делаем POST и получаем ответ от сервера, 2 - Метод которым мы обращаемся
    ).then(response => {
        return response.text(); //Выводим ответ сервера
    }
    ).then(body => {
        console.log(body);
        showCategroyList(JSON.parse(body));
    })
} //Функция получения списка котегорий

function showCategroyList(data){
    let out = '<ul class="category-list"><li><a href="/">Main</a></li>';
    for(let i = 0; i < data.length; i++){
        out += `<li><a href="cat?id=${data[i]['id']}">${data[i]['category']}</a></li>`;
    }
    out += '</ul>';
    document.querySelector('#category-list').innerHTML = out;
}

getCategoryList();

