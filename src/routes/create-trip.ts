import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import { env } from '../env'
import { ClientError } from '../errors/client-error'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'
import { prisma } from '../lib/prisma'

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips',
    {
      schema: {
        tags: ['trips'],
        summary: 'Create a new trip',
        body: z.object({
          destination: z.string().min(4),
          startsAt: z.coerce.date(),
          endsAt: z.coerce.date(),
          ownerEmail: z.string().email(),
          ownerName: z.string(),
          emailsToInvite: z.array(z.string().email()),
        }),
        response: {
          201: z.object({
            tripId: z.string().uuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      const {
        destination,
        endsAt,
        startsAt,
        ownerEmail,
        ownerName,
        emailsToInvite,
      } = request.body

      if (dayjs(startsAt).isBefore(new Date()))
        throw new ClientError('Invalid trip start date')

      if (dayjs(endsAt).isBefore(startsAt))
        throw new ClientError('Invalid trip end date')

      const trip = await prisma.trip.create({
        data: {
          destination,
          endsAt,
          startsAt,
          participants: {
            createMany: {
              data: [
                {
                  email: ownerEmail,
                  name: ownerName,
                  isOwner: true,
                  isConfirmed: true,
                },
                ...emailsToInvite.map((email) => {
                  return {
                    email,
                  }
                }),
              ],
            },
          },
        },
      })

      const formattedStartsDate = dayjs(startsAt).format('LL')
      const formattedEndsDate = dayjs(endsAt).format('LL')

      const confirmedLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

      const mail = await getMailClient()

      const message = await mail.sendMail({
        from: {
          name: 'Equipe plann.er',
          address: 'oi@plann.er',
        },
        to: {
          name: ownerName,
          address: ownerEmail,
        },
        subject: `COnfirme sua viagem para ${destination} em ${formattedStartsDate}`,
        html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas de <strong>${formattedStartsDate}</strong> até <strong>${formattedEndsDate}</strong></p>
          <p></p>
          <p>Para confirmar sua viagem, clique no link abaixo.</p>
          <p></p>
          <p><a href="${confirmedLink}">Confirmar viagem.</a></p>
          <p></p>
          <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail. </p>
        </div>
        `.trim(),
      })

      console.log(nodemailer.getTestMessageUrl(message))

      reply.status(201).send({ tripId: trip.id })
    },
  )
}
