import cors from '@fastify/cors'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { confirmParticipant } from './routes/confirm-participant'
import { confirmTrip } from './routes/confirm-trip'
import { createTrip } from './routes/create-trip'
import { createActivity } from './routes/create-activity'
import { getActivities } from './routes/get-activities'
import { createLinks } from './routes/create-link'
import { getLinks } from './routes/get-links'
import { getParticipants } from './routes/get-participants'
import { createInvite } from './routes/create-invite'
import { updateTrip } from './routes/update-trip'
import { getTripDetails } from './routes/get-trip-details'
import { getParticipant } from './routes/get-participant'
import { env } from './env'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

const app = fastify()

app.register(cors, {
  origin: '*',
})

app.register(fastifySwagger, {
  swagger: {
    consumes: ['application/json'],
    produces: ['application/json'],
    info: {
      title: 'plann.er',
      description:
        'Especificações da API para o back-end da aplicação plann.er construída durante o NLW Journey da Rocketseat',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createTrip)
app.register(updateTrip)
app.register(confirmTrip)
app.register(getTripDetails)

app.register(createActivity)
app.register(getActivities)

app.register(createLinks)
app.register(getLinks)

app.register(getParticipants)
app.register(confirmParticipant)
app.register(getParticipant)
app.register(createInvite)

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log('Server is running!')
  })
