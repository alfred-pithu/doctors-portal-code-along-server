const express = require('express');
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config;
const { MongoClient, ServerApiVersion } = require('mongodb');

//middleware
app.use(cors())
app.use(express.json())

//-------------------------------------------------------------------------
// ${process.env.DB_USER}
// ${process.env.DB_PASS}

///////// environment file er theke neoa id password process.env akare use korle server e problem hocche , kaj kortese na !!!!!!!!!!!!!

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v7gqx.mongodb.net/?retryWrites=true&w=majority`
//------------------------------------------------------------------------

const uri = 'mongodb+srv://doctor_admin:MHgVYl5hU7aNKWbm@cluster0.v7gqx.mongodb.net/?retryWrites=true&w=majority'

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

async function run() {
    try {
        await client.connect();
        console.log('database connected');
        const serviceCollection = client.db('doctors_portal').collection('services')
        const bookingCollection = client.db('doctors_portal').collection('bookings')


        //getting all the services
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services);
        })

        // warning !!!!!!!!!!!!
        // this is not the proper way to query
        // after learning more about more about mongodb . use aggregate lookup , pipeline , match , group

        app.get('/available', async (req, res) => {
            const date = req.query.date
            console.log(req.query);

            //step 1: get all services
            const services = await serviceCollection.find().toArray();

            //step:2 get the bookings of that day  output [{}, {} , {} , {} , {}, {}, {}, {}]
            const query = { date: date }
            const bookings = await bookingCollection.find(query).toArray();

            //step:3 for each service , find bookings for that service
            services.forEach(service => {
                //step:4 find bookings for that service . output [{}, {} , {} , {}]
                const serviceBookings = bookings.filter(book => book.treatment === service.name)

                //step 5: select slots for the serviceBookings : ['' , '' , '']
                const bookedSlots = serviceBookings.map(book => book.slot)

                // step 6: select those slots that are not in bookedSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot))
                service.slots = available;
            })
            res.send(services);
        })

        /* 
     * API Naming convention
     * app.get('/booking') //get all bookings in this collection. or get  more than one or by filter
     * app.get('/booking/:id') //get a specific booking
     * app.post('/booking')  // add a new booking
     * app.patch('/booking/:id')
     * app.delete('/booking/:id')
     */

        //for getting each users bookings/appointments
        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient }
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })

        //for saving user's booking info to the db
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }

            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking)
            res.send({ success: true, result })

        })



    }

    finally {
        // await client.close();
    }
}

run().catch(console.dir)




app.get('/', (req, res) => {
    res.send('Hello from Doctor Unce')
})

app.listen(port, () => {
    console.log('Doctors app listening on porttttt', port);
})