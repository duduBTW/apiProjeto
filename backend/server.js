const mongoose = require('mongoose');
const express = require('express');
var cors = require('cors'); 
const bodyParser = require('body-parser');
const logger = require('morgan');
const Data = require('./data');
const Produtos = require('./produtos');
const Usuarios = require('./usuarios');
const bcrypt = require('bcryptjs');

const API_PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
const router = express.Router();

// this is our MongoDB database
const dbRoute =
  'mongodb+srv://teste:teste@todo-s8ayf.mongodb.net/test?retryWrites=true&w=majority';

// connects our back end code with the database
mongoose.connect(dbRoute, { useNewUrlParser: true, autoIndex: false });
mongoose.set('useFindAndModify', false);

let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));

// checks if connection with the database is successful
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));


// this is our get method
// this method fetches all available data in our database
router.get('/getData', (req, res) => {
  Produtos.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.get('/getProdutos', (req, res) => {
  Produtos.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });

});

// this is our update method
// this method overwrites existing data in our database
router.post('/updateData', (req, res) => {
  const { id, update } = req.body;
  Data.findOneAndUpdate(id, update, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});
router.post('/putCard', (req, res) => {
  const { formData, email } = req.body;
  Usuarios.findOneAndUpdate({email: email}, {$set: {cartao:{numero: formData.number, nome: formData.name, cvc: formData.cvc}}},  { returnOriginal: false }, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// this is our delete method
// this method removes existing data in our database
router.delete('/deleteData', (req, res) => {
  const { id } = req.body;
  Data.findByIdAndRemove(id, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// this is our create methid
// this method adds new data in our database
router.post('/putData', (req, res) => {
  let data = new Data();

  const { id, message } = req.body;

  if ((!id && id !== 0) || !message) {
    return res.json({
      success: false,
      error: 'INVALID INPUTS',
    });
  }
  data.message = message;
  data.id = id;
  data.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post('/putProd', (req, res) => {
  let produtos = new Produtos();

  const { titulo, preco, url } = req.body;

  produtos.titulo = titulo;
  produtos.image = url;
  produtos.preco = preco;
  produtos.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// Adicionar Usuario
  router.post('/putUser', (req, res) => {
    const { nome, email, senha, senha2 } = req.body;
    let erros = [];

    // Checar campos obrigagatorios
    if(!nome || !email || !senha || !senha2){
      erros.push({msg: 'Por favor preencha todos os campos'})
    } else if (senha.length < 6){
      erros.push({msg: 'Senha tem que ter no minimo 6 caracteres'})
    }

    // Checar se as duas senhas são iguais
    if(senha !== senha2){
      erros.push({msg: 'Senhas diferentes'})
    }

    if(erros.length > 0) {
      return res.json({
        success: false,
        error: erros
      });
    } else {
      // Valudação passou *dab

      Usuarios.findOne({ email: email })
        .then(user => {
          if(user){  // Se já esse email ja existir no banco de dados
            erros.push({msg: 'Email já registrado'})

            return res.json({
              success: false,
              error: erros
            });
          } else { // Se já não existir
              let NovoUsuario = new Usuarios({
                nome,
                email,
                senha
              });

              // Criptografar senha
              bcrypt.genSalt(10, (err, salt) => 
                bcrypt.hash(NovoUsuario.senha, salt, (err, hash) =>{
                  if (err) throw err;

                  // Mudar senha para criptografada
                  NovoUsuario.senha = hash;
                  
                  //Salvar Usuario
                  NovoUsuario.save((err) => {
                    if (err) return res.json({ success: false, error: err });
                    return (res.json({ success: true }));
                  });
                }))
          }
        });

    }

  });

// Login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if(!email || !senha ) {
    return (res.json({ success: false, msg: 'Ambos os campos devem ser preenchidos' }));
  }

  Usuarios.findOne({
    email: email
  }).then(user => {
    if(!user) {
      return (res.json({ success: false, msg: 'Email não cadastrado' }));
    }

    // Checar senha
    bcrypt.compare(senha, user.senha, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        return (res.json({ success: true, user: user }));
      } else {
        return (res.json({ success: false, msg: 'Senha errada' }));
      }
    });
  })
});
  
// append /api for our http requests
app.use('/api', router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));