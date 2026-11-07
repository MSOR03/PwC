import { createApp } from "./app";

const port =Number(process.env.PORT ?? 3000);

const app=createApp() //Create an instance from createApp

app.listen(port,()=>{
    console.log(`facturia-api listening on http://localhost:${port}`)
});