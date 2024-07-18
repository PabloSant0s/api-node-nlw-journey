import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { ClientError } from '../errors/client-error'
import { dayjs } from '../lib/dayjs'
import { prisma } from '../lib/prisma'

export async function getActivities(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/activities',
    {
      schema: {
        tags: ['activities'],
        summary: 'Get all activities',
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            activities: z.array(
              z.object({
                date: z.coerce.date(),
                activities: z.array(
                  z.object({
                    id: z.string().uuid(),
                    title: z.string(),
                    occursAt: z.coerce.date(),
                    tripId: z.string().uuid(),
                  }),
                ),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          activities: {
            orderBy: {
              occursAt: 'asc',
            },
          },
        },
      })

      if (!trip) throw new ClientError('Trip not found')

      const differenceInDaysBetweenTripStartAndEnd = dayjs(trip.endsAt).diff(
        trip.startsAt,
        'days',
      )
      console.log(differenceInDaysBetweenTripStartAndEnd)

      const activities = Array.from({
        length: differenceInDaysBetweenTripStartAndEnd + 1,
      }).map((_, index) => {
        const date = dayjs(trip.startsAt).add(index, 'days')
        return {
          date: date.toDate(),
          activities: trip.activities.filter((activity) =>
            dayjs(activity.occursAt).isSame(date, 'day'),
          ),
        }
      })

      return reply.status(200).send({
        activities,
      })
    },
  )
}
