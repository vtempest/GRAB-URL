import {log} from "../src/log-json"

log("Downloading...", {
    startSpinner: true,
    color: "magenta"
})

setTimeout(()=>
    
    log("complete", {
        stopSpinner: true
    })
    
,2000)