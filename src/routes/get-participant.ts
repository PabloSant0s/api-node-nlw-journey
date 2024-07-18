import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function getParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId',
    {
      schema: {
        tags: ['participants'],
        summary: 'Get participant details',
        params: z.object({
          participantId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            participant: z.object({
              id: z.string().uuid(),
              name: z.string().nullable(),
              email: z.string().email(),
              isConfirmed: z.boolean(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { participantId } = request.params

      const participant = await prisma.participant.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          isConfirmed: true,
        },
        where: {
          id: participantId,
        },
      })

      if (!participant) throw new ClientError('Participant not found')

      return reply.status(200).send({
        participant,
      })
    },
  )
}
