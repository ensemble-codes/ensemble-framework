export default function parsePrompt(prompt: string) {
    const params = prompt.split(".")
    const args: {[key: string]: string} = {}
    
    for (let param of params) {
      const [key, value] = param.split(":").map(part => part.trim())
      args[key] = value
    }
   
    return args
}
