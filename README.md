# 💈 Sistema de Gerenciamento de Barbearia - WE Barbearia

Um sistema completo e moderno para gerenciamento de barbearias, desenvolvido com **Next.js 15**, **TypeScript**, **Prisma** e **Tailwind CSS**. Oferece controle total sobre filas, agendamentos, histórico de serviços, dashboard administrativo e muito mais.

---

## 🚀 Deployment
🔗 **Link de Produção:** [https://system-barber-queue.vercel.app](https://system-barber-queue.vercel.app)

---

## ✨ Funcionalidades Principais

### 🔐 **Sistema de Autenticação Avançado**
- **Registro Flexível**: Cadastro com nome, telefone, email (opcional) e senha
- **Login Inteligente**: Login automático via email ou telefone
- **Recuperação de Senha**: Sistema completo de reset via código de verificação
- **Autenticação JWT**: Tokens seguros armazenados em cookies HttpOnly
- **Validação de Senha**: Critérios flexíveis (mínimo 4 caracteres)
- **Múltiplos Perfis**: Cliente, Barbeiro e Administrador

### 📋 **Sistema de Fila Inteligente**
- **Fila em Tempo Real**: Atualizações instantâneas via Server-Sent Events (SSE)
- **Múltiplos Barbeiros**: Cada barbeiro possui sua própria fila
- **Estimativa de Tempo**: Cálculo automático do tempo de espera
- **Posicionamento Dinâmico**: Visualização da posição na fila
- **Status em Tempo Real**: Aguardando, Em Atendimento, Concluído
- **Notificações**: Alertas automáticos de mudanças na fila

### 🎯 **Gerenciamento de Serviços**
- **Catálogo Completo**: CRUD de serviços com preços e tempo estimado
- **Seleção Múltipla**: Escolha de vários serviços por atendimento
- **Quantidade Flexível**: Múltiplas unidades do mesmo serviço (ex: 3x Barba)
- **Serviços Extras**: Adição de serviços durante o atendimento
- **Remoção Dinâmica**: Remoção instantânea de serviços com proteção
- **Cálculo Automático**: Valores e tempos atualizados em tempo real

### 💰 **Sistema de Pagamento Completo**
- **Múltiplos Métodos**: Dinheiro, PIX, Cartão de Débito e Crédito
- **Parcelamento**: Até 3x no cartão de crédito
- **Taxas Configuráveis**: Sistema flexível de taxas por método
- **Cálculo de Comissões**: Controle automático de comissões dos barbeiros
- **Relatórios Financeiros**: Análise detalhada de receitas e taxas

### 📊 **Dashboard Administrativo**
- **Métricas em Tempo Real**: Receita, atendimentos, clientes
- **Gráficos Interativos**: Visualização de dados por período
- **Análise de Performance**: Métricas por barbeiro e serviço
- **Relatórios Personalizados**: Filtros por data, barbeiro, serviço
- **Indicadores KPI**: Crescimento, média de atendimentos, receita

### 📈 **Histórico e Relatórios**
- **Histórico Completo**: Todos os atendimentos realizados
- **Detalhes Expandidos**: Serviços, produtos, valores, métodos de pagamento
- **Filtros Avançados**: Por cliente, barbeiro, serviço, período
- **Exportação de Dados**: Relatórios para análise externa
- **Busca Inteligente**: Localização rápida de atendimentos

### 👥 **Gerenciamento de Usuários**
- **Perfis Diferenciados**: Cliente, Barbeiro, Administrador
- **Controle de Acesso**: Permissões específicas por tipo de usuário
- **Perfil Personalizado**: Edição de dados pessoais e preferências
- **Status de Barbeiros**: Ativo/Inativo com controle de disponibilidade

### 🛍️ **Controle de Estoque**
- **Catálogo de Produtos**: Gestão completa de produtos utilizados
- **Controle de Estoque**: Atualização automática após uso
- **Relatórios de Consumo**: Análise de produtos mais utilizados
- **Alertas de Estoque**: Notificações de produtos em baixa

### 📱 **Interface Responsiva**
- **Design Moderno**: Interface dark com elementos glassmorphism
- **Mobile First**: Totalmente responsivo para todos os dispositivos
- **Animações Suaves**: Transições e microinterações elegantes
- **Feedback Visual**: Toasts informativos e loading states
- **Acessibilidade**: Componentes acessíveis e navegação por teclado

### 🔄 **Integrações e Automações**
- **WhatsApp Integration**: Notificações automáticas via WhatsApp
- **Email Service**: Sistema de emails transacionais
- **SMS Notifications**: Alertas via SMS para clientes
- **Backup Automático**: Sincronização e backup de dados

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Next.js 15** - Framework React com SSR/SSG
- **TypeScript** - Tipagem estática para maior robustez
- **Tailwind CSS** - Estilização utilitária e responsiva
- **Framer Motion** - Animações e transições suaves
- **Shadcn/UI** - Componentes modernos e acessíveis
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Sonner** - Sistema de notificações elegante

### **Backend**
- **Next.js API Routes** - APIs RESTful integradas
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados relacional robusto
- **JWT** - Autenticação segura com tokens
- **bcryptjs** - Criptografia de senhas
- **Server-Sent Events** - Atualizações em tempo real

### **Segurança**
- **Rate Limiting** - Proteção contra ataques de força bruta
- **CORS Configuration** - Controle de origem de requisições
- **Input Validation** - Validação rigorosa de dados
- **SQL Injection Protection** - Queries parametrizadas
- **XSS Protection** - Sanitização de dados
- **CSRF Protection** - Tokens de proteção contra CSRF

### **DevOps e Qualidade**
- **Vitest** - Testes unitários e de integração
- **ESLint** - Análise estática de código
- **Prettier** - Formatação consistente
- **TypeScript Strict Mode** - Verificação rigorosa de tipos
- **Vercel Deployment** - Deploy automatizado

---

## 📁 Estrutura do Projeto

```
system-barber-queue/
├── src/
│   ├── app/
│   │   ├── (pages)/
│   │   │   ├── auth/                    # Páginas de autenticação
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── reset-password/
│   │   │   │   └── verify-code/
│   │   │   ├── client/                  # Área do cliente
│   │   │   │   └── [id]/
│   │   │   │       ├── profile/
│   │   │   │       └── queue/
│   │   │   └── main/                    # Dashboard administrativo
│   │   │       └── [id]/
│   │   ├── api/                         # APIs do sistema
│   │   │   ├── auth/                    # Autenticação
│   │   │   ├── queue/                   # Gerenciamento de fila
│   │   │   ├── services/                # CRUD de serviços
│   │   │   ├── users/                   # Gerenciamento de usuários
│   │   │   ├── barbers/                 # Controle de barbeiros
│   │   │   ├── history/                 # Histórico de atendimentos
│   │   │   ├── dashboard/               # Métricas e relatórios
│   │   │   ├── items/                   # Controle de produtos
│   │   │   └── settings/                # Configurações do sistema
│   │   ├── _components/                 # Componentes reutilizáveis
│   │   │   ├── modals/                  # Modais do sistema
│   │   │   ├── charts/                  # Gráficos e visualizações
│   │   │   ├── forms/                   # Formulários
│   │   │   └── ui/                      # Componentes de interface
│   │   ├── globals.css                  # Estilos globais
│   │   ├── layout.tsx                   # Layout principal
│   │   └── page.tsx                     # Página inicial
│   ├── components/ui/                   # Componentes Shadcn/UI
│   ├── lib/                             # Utilitários e configurações
│   │   ├── hooks/                       # Custom hooks
│   │   ├── context/                     # Contextos React
│   │   ├── schemas/                     # Schemas de validação
│   │   ├── utils.ts                     # Funções utilitárias
│   │   ├── prisma.ts                    # Configuração Prisma
│   │   ├── jwt-utils.ts                 # Utilitários JWT
│   │   ├── email-service.ts             # Serviço de email
│   │   ├── sms-service.ts               # Serviço de SMS
│   │   ├── whatsapp-service.ts          # Integração WhatsApp
│   │   └── security-config.ts           # Configurações de segurança
│   └── middleware.ts                    # Middleware de autenticação
├── prisma/
│   └── schema.prisma                    # Schema do banco de dados
├── tests/                               # Testes automatizados
│   ├── api/                             # Testes de API
│   ├── components/                      # Testes de componentes
│   ├── integration/                     # Testes de integração
│   └── auth/                            # Testes de autenticação
├── public/                              # Arquivos estáticos
├── .env                                 # Variáveis de ambiente
├── package.json                         # Dependências e scripts
└── README.md                            # Este arquivo
```

---

## 🚀 Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL
- Git
- Conta Vercel (para deploy)

### **Instalação Local**

1️⃣ **Clone o repositório:**
```bash
git clone https://github.com/Ruan-nascimento/system-barber-queue.git
cd system-barber-queue
```

2️⃣ **Instale as dependências:**
```bash
npm install
```

3️⃣ **Configure as variáveis de ambiente (.env):**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/barber_queue"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Email Service (opcional)
EMAIL_SERVICE_API_KEY="your-email-service-key"

# SMS Service (opcional)
SMS_SERVICE_API_KEY="your-sms-service-key"

# WhatsApp Integration (opcional)
WHATSAPP_API_KEY="your-whatsapp-api-key"
```

4️⃣ **Configure o banco de dados:**
```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrações
npx prisma db push

# (Opcional) Popular com dados de exemplo
npx prisma db seed
```

5️⃣ **Execute o projeto:**
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

6️⃣ **Acesse a aplicação:**
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api

---

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Testes de integração
npm run test:integration
```

---

## 📊 Funcionalidades Detalhadas

### **🔐 Sistema de Autenticação**
- Registro com validação de dados
- Login flexível (email ou telefone)
- Recuperação de senha via código
- Sessões seguras com JWT
- Controle de permissões por perfil
- Logout automático por inatividade

### **📋 Gerenciamento de Fila**
- Adição automática à fila
- Visualização em tempo real
- Estimativa de tempo de espera
- Notificações de mudança de status
- Cancelamento de entrada na fila
- Movimentação de posições (admin)

### **💼 Dashboard Administrativo**
- Métricas de receita por período
- Gráficos de atendimentos
- Análise de performance por barbeiro
- Relatórios de comissões
- Controle de taxas de pagamento
- Exportação de relatórios

### **🛍️ Controle de Produtos**
- Cadastro de produtos
- Controle de estoque
- Uso automático durante atendimento
- Relatórios de consumo
- Alertas de estoque baixo

### **📱 Interface do Cliente**
- Visualização da fila pessoal
- Histórico de atendimentos
- Edição de perfil
- Notificações personalizadas
- Avaliação de serviços

---

## 🔒 Segurança

- **Autenticação JWT** com cookies HttpOnly
- **Rate Limiting** para prevenir ataques
- **Validação rigorosa** de todos os inputs
- **Criptografia** de senhas com bcrypt
- **Proteção CSRF** em formulários
- **Sanitização** de dados de entrada
- **Logs de segurança** para auditoria

---

## 🚀 Deploy

### **Vercel (Recomendado)**
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### **Outras Plataformas**
- **Netlify**: Suporte completo para Next.js
- **Railway**: Deploy com banco PostgreSQL
- **Heroku**: Configuração via Procfile

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Ruan Carlos**
- GitHub: [@Ruan-nascimento](https://github.com/Ruan-nascimento)
- LinkedIn: [Ruan Carlos](https://linkedin.com/in/ruan-carlos)

---

## 🙏 Agradecimentos

- Comunidade Next.js
- Equipe Prisma
- Contribuidores do projeto
- Beta testers e usuários

---

**💈 Transformando a gestão de barbearias com tecnologia moderna! ✨**

