const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '/restaurante';
const SESSION_SECRET = process.env.SESSION_SECRET || 'sabor-cia-session-dev';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const UPLOADS_DIR = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, 'uploads');

const meses = [
    { numero: 1, slug: '1-janeiro', nome: 'Janeiro' },
    { numero: 2, slug: '2-fevereiro', nome: 'Fevereiro' },
    { numero: 3, slug: '3-marco', nome: 'Março' },
    { numero: 4, slug: '4-abril', nome: 'Abril' },
    { numero: 5, slug: '5-maio', nome: 'Maio' },
    { numero: 6, slug: '6-junho', nome: 'Junho' },
    { numero: 7, slug: '7-julho', nome: 'Julho' },
    { numero: 8, slug: '8-agosto', nome: 'Agosto' },
    { numero: 9, slug: '9-setembro', nome: 'Setembro' },
    { numero: 10, slug: '10-outubro', nome: 'Outubro' },
    { numero: 11, slug: '11-novembro', nome: 'Novembro' },
    { numero: 12, slug: '12-dezembro', nome: 'Dezembro' }
];

const mesesPorSlug = new Map(meses.map((mes) => [mes.slug, mes]));
const mesesPorNome = new Map(meses.map((mes) => [mes.nome.toLowerCase(), mes]));
const mesesPorNumero = new Map(meses.map((mes) => [mes.numero, mes]));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            cb(new Error('Apenas arquivos PDF são permitidos.'));
            return;
        }

        cb(null, true);
    }
});

app.set('trust proxy', process.env.TRUST_PROXY === 'true');
app.use(BASE_PATH, express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function garantirDiretorio(caminho) {
    await fsp.mkdir(caminho, { recursive: true });
}

function sanitizarAno(valor) {
    const ano = Number.parseInt(String(valor), 10);

    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
        return null;
    }

    return ano;
}

function resolverMes(valor) {
    if (valor === undefined || valor === null) {
        return null;
    }

    const texto = String(valor).trim().toLowerCase();

    if (mesesPorSlug.has(texto)) {
        return mesesPorSlug.get(texto);
    }

    if (mesesPorNome.has(texto)) {
        return mesesPorNome.get(texto);
    }

    const numero = Number.parseInt(texto, 10);

    if (mesesPorNumero.has(numero)) {
        return mesesPorNumero.get(numero);
    }

    return null;
}

function caminhoCardapio(ano, mesSlug) {
    return path.join(UPLOADS_DIR, String(ano), `${mesSlug}.pdf`);
}

async function cardapioExiste(ano, mesSlug) {
    const arquivo = caminhoCardapio(ano, mesSlug);

    try {
        await fsp.access(arquivo, fs.constants.F_OK);
        return arquivo;
    } catch {
        return null;
    }
}

function autenticarAdmin(req, res, next) {
    if (req.session.adminAutenticado) {
        next();
        return;
    }

    res.redirect(`${BASE_PATH}/admin/login`);
}

function redirecionarAdminErro(res, ano, erro) {
    const query = new URLSearchParams();
    query.set('ano', String(ano || new Date().getFullYear()));
    query.set('erro', erro);
    res.redirect(`${BASE_PATH}/admin?${query.toString()}`);
}

app.get(`${BASE_PATH}/cardapio`, async (req, res) => {
    
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1;
    const mesSelecionado = mesesPorNumero.get(mes);

    if (!mesSelecionado) {
        res.status(404).send('Cardápio deste mês ainda não disponível.');
        return;
    }

    const arquivo = await cardapioExiste(ano, mesSelecionado.slug);

    if (!arquivo) {
        res.status(404).send('Cardápio deste mês ainda não disponível.');
        return;
    }

    res.download(arquivo, `cardapio-${ano}-${mesSelecionado.slug}.pdf`);
});

app.get(`${BASE_PATH}/cardapio/:ano/:mes`, async (req, res) => {
    const ano = sanitizarAno(req.params.ano);
    const mes = resolverMes(req.params.mes);

    if (!ano) {
        res.status(400).send('Ano inválido.');
        return;
    }

    if (!mes) {
        res.status(400).send('Mês inválido.');
        return;
    }

    const arquivo = await cardapioExiste(ano, mes.slug);

    if (!arquivo) {
        res.status(404).send('Cardápio não encontrado.');
        return;
    }

    res.download(arquivo, `cardapio-${ano}-${mes.slug}.pdf`);
});



app.get(`${BASE_PATH}/sobre`, (req, res) => {
    res.render('sobre', { basePath: BASE_PATH });
});

app.get(`${BASE_PATH}/admin/login`, (req, res) => {
    if (req.session.adminAutenticado) {
        res.redirect(`${BASE_PATH}/admin`);
        return;
    }

    res.render('admin-login', {
        basePath: BASE_PATH,
        erro: req.query.erro || '',
        emailPreenchido: req.session.adminEmail || ''
    });
});

app.post(`${BASE_PATH}/admin/login`, (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        res.status(500).render('admin-login', {
            basePath: BASE_PATH,
            erro: 'Configure ADMIN_EMAIL e ADMIN_PASSWORD no ambiente.',
            emailPreenchido: email
        });
        return;
    }

    if (email !== ADMIN_EMAIL || senha !== ADMIN_PASSWORD) {
        res.status(401).render('admin-login', {
            basePath: BASE_PATH,
            erro: 'E-mail ou senha inválidos.',
            emailPreenchido: email
        });
        return;
    }

    req.session.adminAutenticado = true;
    req.session.adminEmail = email;
    res.redirect(`${BASE_PATH}/admin`);
});

app.get(`${BASE_PATH}/admin`, autenticarAdmin, async (req, res) => {
    const anoSelecionado = sanitizarAno(req.query.ano) || new Date().getFullYear();
    const statusCardapios = await Promise.all(meses.map(async (mes) => ({
        ...mes,
        disponivel: Boolean(await cardapioExiste(anoSelecionado, mes.slug))
    })));

    res.render('admin', {
        basePath: BASE_PATH,
        adminEmail: req.session.adminEmail,
        anoSelecionado,
        meses: statusCardapios,
        sucesso: req.query.sucesso || '',
        erro: req.query.erro || ''
    });
});

app.post(`${BASE_PATH}/admin/cardapio`, autenticarAdmin, upload.single('cardapio'), async (req, res) => {
    const ano = sanitizarAno(req.body.ano);
    const mes = resolverMes(req.body.mes);

    if (!ano || !mes) {
        redirecionarAdminErro(res, ano, 'Informe um ano e um mês válidos.');
        return;
    }

    if (!req.file) {
        redirecionarAdminErro(res, ano, 'Selecione um arquivo PDF para enviar.');
        return;
    }

    if (req.file.mimetype !== 'application/pdf') {
        redirecionarAdminErro(res, ano, 'O arquivo enviado precisa ser um PDF.');
        return;
    }

    await garantirDiretorio(path.join(UPLOADS_DIR, String(ano)));
    await fsp.writeFile(caminhoCardapio(ano, mes.slug), req.file.buffer);

    const query = new URLSearchParams();
    query.set('ano', String(ano));
    query.set('sucesso', `Cardápio de ${mes.nome} de ${ano} enviado com sucesso.`);
    res.redirect(`${BASE_PATH}/admin?${query.toString()}`);
});

app.get(`${BASE_PATH}/admin/logout`, autenticarAdmin, (req, res) => {
    req.session.destroy(() => {
        res.redirect(`${BASE_PATH}/admin/login`);
    });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (req.originalUrl.startsWith(`${BASE_PATH}/admin`)) {
            const ano = sanitizarAno(req.body?.ano) || new Date().getFullYear();

            if (err.code === 'LIMIT_FILE_SIZE') {
                redirecionarAdminErro(res, ano, 'O arquivo ultrapassa o limite de 10 MB.');
                return;
            }

            redirecionarAdminErro(res, ano, 'Não foi possível processar o upload.');
            return;
        }

        res.status(400).send('Não foi possível processar o upload.');
        return;
    }

    if (err && err.message === 'Apenas arquivos PDF são permitidos.') {
        if (req.originalUrl.startsWith(`${BASE_PATH}/admin`)) {
            const ano = sanitizarAno(req.body?.ano) || new Date().getFullYear();
            redirecionarAdminErro(res, ano, err.message);
            return;
        }

        res.status(400).send(err.message);
        return;
    }

    next(err);
});

app.use((req, res) => {
    console.log('Rota não encontrada:', req.url);
    res.status(404).send('404');
});

garantirDiretorio(UPLOADS_DIR).catch((erro) => {
    console.error('Falha ao criar diretório de uploads:', erro);
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});