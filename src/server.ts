import cors from '@fastify/cors'
import fastify from 'fastify'
import {
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

const app = fastify()

app.register(cors, {
  origin: '*',
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
