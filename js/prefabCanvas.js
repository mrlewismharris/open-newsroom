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

    let canvas = this.parent.children[0].children[1].children[0]
    //TODO START FROM HERE :
      //Add totalWidth which will get the width of the inner window
      //Then use the "fit" case to scale the element properly
      //figure out why the scaling is not working properly haha
    //let totalWidth = ...

    switch(style) {
      case "fit":
          canvas.style.transform = "scale(1)"
        break;
      case "actual":

        break;
    }
  }

}