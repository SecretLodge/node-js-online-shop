let express = require('express');
let app = express();
app.use(express.static('public')); //public - имя папки где хранится статика

app.set('view engine', 'pug');

let mysql = require('mysql2'); //Подключаем mysql2 

app.use(express.json());

const nodemailer = require('nodemailer');

let connection = mysql.createConnection({
    host: 'eu-cdbr-west-01.cleardb.com',
    user: 'ba9751ba8a03f6',
    password: 'a30229a0',
    database: 'heroku_d4f41e17692b970'
});

app.listen(process.evn.PORT || 3000, () => {
    console.log('node express node work on 3000');
});

app.get('/', (requset, response) => {
    let cat = new Promise((resolve, reject) => {
        connection.query(
            "select id, name, cost, image, category from (select id, name, cost, image, category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind  from goods, ( select @curr_category := '' ) v ) goods where ind < 3",
            (error, result, fields) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
    let catDescription = new Promise((resolve, reject) => {
        connection.query(
            "SELECT * FROM category",
            (error, result, fields) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
    Promise.all([cat, catDescription]).then(value => {
        response.render('index', {
            goods: JSON.parse(JSON.stringify(value[0])),
            cat: JSON.parse(JSON.stringify(value[1]))
        });
    });
    // connection.query(
    //     'SELECT * FROM goods',
    //     (error, result) => {
    //         if(error) throw error;
    //         let goods = {};
    //         for(let i = 0; i < result.length; i++){
    //             goods[result[i]['id']] = result[i];
    //         }
    //         response.render('main', {foo: 'hello', bar: 7, goods: JSON.parse(JSON.stringify(goods))});
    //     })
});

app.get('/cat', (requset, response) => {
    let catId = requset.query.id;

    //Делаем промисы для того чтобы дождаться пока функции в них выполняться и уже после этого вывести общую информацию на страницу
    let cat = new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM category WHERE id=' + catId,
            (error, result) => {
                if (error) reject(error);
                resolve(result); //Если всё ОК, то возвращаем результат
            }
        );
    });

    let goods = new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM goods WHERE category=' + catId,
            (error, result) => {
                if (error) reject(error);
                resolve(result); //Если всё ОК, то возвращаем результат
            }
        );
    });

    //Ждем пока выполняться оба промиса и уже полсе этого рендерим страницу
    Promise.all([cat, goods]).then(value => {
        response.render('cat', {
            cat: JSON.parse(JSON.stringify(value[0])),
            goods: JSON.parse(JSON.stringify(value[1]))
        });
    });
});

app.get('/goods', (requset, response) => {
    connection.query('SELECT * FROM goods WHERE id=' + requset.query.id, (error, result, fields) => {
        if (error) throw error;
        response.render('goods', { goods: JSON.parse(JSON.stringify(result)) });
    });
});

app.get('/order', (requset, response) => {
    response.render('order');
})

app.get('/*', (requset, response) => {
    response.render('error');
});

app.post('/get-category-list', (request, response) => { //Отправляем POST ответ на URL
    connection.query('SELECT id, category FROM category', (error, result, fields) => { //Из базы данных выбираем id, category
        if (error) throw error;
        console.log(result);
        response.json(result); //Отправляем ответ сервера в виде файла json с данными из базы данных
    });
});

app.post('/get-goods-info', (request, response) => { //Отправляем POST ответ на URL
    console.log(request.body.key);
    if (request.body.key.length != 0) {
        connection.query('SELECT id,name,cost FROM goods WHERE id IN (' + request.body.key.join(',') + ')', (error, result, fields) => { //Из базы данных выбираем id, category
            if (error) throw error;
            let goods = {};
            for (let i = 0; i < result.length; i++) {
                goods[result[i]['id']] = result[i];
            }
            response.json(goods); //Отправляем ответ сервера в виде файла json с данными из базы данных
        });
    }
    else {
        response.send('0');
    }
});

app.post('/finish-order', (request, response) => {
    console.log(request.body);
    if (request.body.key.length != 0) { //Если в корзине что-то есть
        let key = Object.keys(request.body.key); //Берём id товаров
        connection.query('SELECT id,name,cost FROM goods WHERE id IN (' + key.join(',') + ')', (error, result, fields) => { //Из ответа выбираем id
            if (error) throw error;
            sendMail(request.body, result).catch(console.error);
            response.send('1');
        })

    } else {
        response.send('0'); //Отвечаем что корзина пустая
    }
});

async function sendMail(data, result) {
    let res = '<h2>Order in lite show</h2>';
    let total = 0;
    for (let i = 0; i < result.length; i++) {
        res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} - ${result[i]['cost'] * data.key[result[i]['id']]} uah</p>`;
        total += result[i]['cost'] * data.key[result[i]['id']];
    }
    console.log(res);
    res += '<hr>';
    res += `Total ${total} uah`;
    res += `<hr>Phone: ${data.phone}`;
    res += `<hr>Username: ${data.username}`;
    res += `<hr>Address: ${data.address}`;
    res += `<hr>Email: ${data.email}`;

    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    let mailOption = {
        from: '<boxofmonster@mail.ru>',
        to: 'boxofmonster@mail.ru,' + data.email,
        subject: 'Lite shop order',
        text: 'Hello world',
        html: res
    };

    let info = await transporter.sendMail(mailOption);
    console.log("MessageSent: %s", info.messageId);
    console.log("PreviewSent: %s", nodemailer.getTestMessageUrl(info));
    return true;
};