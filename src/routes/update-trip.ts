import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { ClientError } from '../errors/client-error'
import { dayjs } from '../lib/dayjs'
import { prisma } from '../lib/prisma'

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/trips/:tripId',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          startsAt: z.coerce.date(),
          endsAt: z.coerce.date(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params
      const { destination, endsAt, startsAt } = request.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      })

      if (dayjs(startsAt).isBefore(new Date()))
        throw new ClientError('Invalid trip start date')

      if (dayjs(endsAt).isBefore(startsAt))
        throw new ClientError('Invalid trip end date')

      if (!trip) throw new ClientError('Trip not found.')

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          destination,
          endsAt,
          startsAt,
        },
      })

      reply.status(200).send({ tripId: trip.id })
    },
  )
}
