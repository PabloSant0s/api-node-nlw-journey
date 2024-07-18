import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function getTripDetails(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId',
    {
      schema: {
        tags: ['trips'],
        summary: 'Get trip details',
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            trip: z.object({
              id: z.string().uuid(),
              destination: z.string(),
              startsAt: z.date(),
              endsAt: z.date(),
              isConfirmed: z.boolean(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          id: true,
          destination: true,
          startsAt: true,
          endsAt: true,
          isConfirmed: true,
        },
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      reply.send({
        trip,
      })
    },
  )
}
