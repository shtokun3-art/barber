import * as emoji from 'node-emoji'

type message = {
    userName: string
    greeting: string
    servicesList: string
}

export const Message = ({userName, greeting, servicesList}:message) => {
    const messageFormat = emoji.emojify(`${":loudspeaker:"} *LA Barbearia WE*


Olá, *${userName}!* ${greeting}

Estamos passando aqui pra te lembrar que já tá quase na sua vez de ser atendido! ${":scissors:"}${":fire:"}
Segue abaixo os serviços agendados pra você:

${":memo:"} *Serviços:*
${servicesList}

${":speech_balloon:"} Pedimos que se dirija até a barbearia o quanto antes, pra garantir que você não perca sua vez na fila, beleza?

Vai ser um prazer te receber por aqui e deixar você na régua! ${":sunglasses:"}${":sparkles:"}

Nos vemos já já!
*Abraço da equipe da LA Barbearia WE ${":handshake:"}${":barber:"}*`)

    return messageFormat
} 