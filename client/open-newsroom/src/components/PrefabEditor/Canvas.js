import { Container } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import './PrefabEditor.css'

export default function Canvas(props) {
  const [canvasSize, setCanvasSize] = useState({width: 0, height: 0})
  const [zoom, setZoom] = useState(0.4)
  
  function centerCanvas() {
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

  useEffect(() => {
    setCanvasSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }, [])

  return (
    <Container className="canvasContainer">
      <canvas
        width={props.width}
        height={props.height}
        className="editingCanvas"
        style={{transform: `scale(${zoom})`}}
      ></canvas>
    </Container>
  );
}