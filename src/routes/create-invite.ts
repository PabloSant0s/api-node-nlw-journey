import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'
import nodemailer from 'nodemailer'
import { ClientError } from '../errors/client-error'
import { env } from '../env'

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/invites',
    {
      schema: {
        tags: ['participants'],
        summary: 'Create a new invite for a trip',
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          201: z.object({
            participantId: z.string().uuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params
      const { email } = request.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      })

      if (!trip) throw new ClientError('Trip not found.')

      const participant = await prisma.participant.create({
        data: {
          email,
          tripId,
        },
      })

      const formattedStartsDate = dayjs(trip.startsAt).format('LL')
      const formattedEndsDate = dayjs(trip.endsAt).format('LL')

      const mail = await getMailClient()

      const confirmedLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`
      const message = await mail.sendMail({
        from: {
          name: 'Equipe plann.er',
          address: 'oi@plann.er',
        },
        to: email,
        subject: `Confirme sua presenca na viagem para ${trip.destination} em ${formattedStartsDate}`,
        html: `
              <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                <p>Você foi convidado para participar de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartsDate}</strong> até <strong>${formattedEndsDate}</strong></p>
                <p></p>
                <p>Para confirmar sua presença na viagem, clique no link abaixo.</p>
                <p></p>
                <p><a href="${confirmedLink}">Confirmar viagem.</a></p>
                <p></p>
                <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail. </p>
              </div>
              `.trim(),
      })

      console.log(nodemailer.getTestMessageUrl(message))

      reply.status(201).send({
        participantId: participant.id,
      })
    },
  )
}
