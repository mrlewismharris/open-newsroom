class prefabCanvas {

  constructor(container) {

    this.parent = container

    //first outercontainer (dimmed bg)
    let outerContainer = document.createElement("div")
      outerContainer.className = "prefabCanvas_outerContainer"

    let closeButton = document.createElement("div")
      closeButton.className = "prefabCanvas_closeButton noselect"
      closeButton.innerText = "X"
      closeButton.addEventListener("click", () => {
        this.closeParent()
      })
    
    //second innerContainer will contain the padded elements: toolbar, canvas, buttons
    let innerContainer = document.createElement("div")
      innerContainer.className = "prefabCanvas_innerContainer"

    let canvas = document.createElement("div")
      canvas.className = "prefabCanvas_canvas"
      canvas.style.width = ini.canvas.width + "px"
      canvas.style.height = ini.canvas.height + "px"

    //appends
    innerContainer.appendChild(canvas)

    outerContainer.appendChild(closeButton)
    outerContainer.appendChild(innerContainer)
    
    container.appendChild(outerContainer)

    this.resize("fit")

    return 0
  }

  closeParent() {
    this.parent.innerHTML = ""
    this.parent.classList.add("hidden")
  }

  resize(style) {

    let container = this.parent.children[0].children[1]
    let canvas = this.parent.children[0].children[1].children[0]

    switch(style) {
      case "fit":
          canvas.style.transform = "scale(0.3)"
          this.center()
        break;
      case "actual":

        break;
    }
  }

  center() {
    //exactly center IF the scrollbars are 17 pixels, which there aren't on all browsers
    let container = this.parent.children[0]
    let canvas = this.parent.children[0].children[1].children[0]
    let scale = 1
    if (canvas.style.transform) {
      scale = canvas.style.transform.split("(")[1].split(")")[0]
    }
    //needs to have a setTimeout IDK WHY!!!
    setTimeout(() => {
      window.scroll(
        (container.clientWidth/2-((canvas.clientWidth*scale)/2))-((window.innerWidth - canvas.clientWidth*scale)/2)+8.5,
        (container.clientHeight/2-((canvas.clientHeight*scale)/2))-((window.innerHeight - canvas.clientHeight*scale)/2)+8.5
      )
    }, 1)
  }
}