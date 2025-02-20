document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    const personaEditor = document.querySelector('persona-editor')
    console.log({personaEditor})
    const savebtn = personaEditor.shadowRoot.querySelector('#save-persona')[0]
    console.log({savebtn})
    const heygenAdmin = document.createElement('avatar-settings')
    console.log({heygenAdmin})
    savebtn.parentNode.insertBefore(heygenAdmin, savebtn)
  }, 1000)
}
 
