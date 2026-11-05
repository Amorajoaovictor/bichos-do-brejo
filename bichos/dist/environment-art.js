import * as THREE from 'three';

// Raster props remain still until the player activates an interaction.
export async function createEnvironmentArt({scene,camera,tiles,viewport}){
  const textures=new Map(await Promise.all(['rock','log'].map(async kind=>{
    const texture=await new THREE.TextureLoader().loadAsync(`/art/cenario/interativos-v1/${kind}.png`);
    texture.colorSpace=THREE.SRGBColorSpace;return [kind,texture];
  })));
  const views=new Map();
  const heldRock=new THREE.Mesh(new THREE.PlaneGeometry(.3,.28),new THREE.MeshBasicMaterial({map:textures.get('rock'),transparent:true,depthTest:false,depthWrite:false}));
  heldRock.quaternion.copy(camera.quaternion);heldRock.visible=false;scene.add(heldRock);
  function position(cell){const t=tiles.find(t=>t.userData.col===cell.col&&t.userData.row===cell.row)?.userData;return new THREE.Vector3(t.x,.05,t.z);}
  function order(view){view.mesh.renderOrder=1000000+Math.round((view.root.position.z*.88+view.root.position.x*.47)*100)*1000+600;}
  function sync(props){
    for(const prop of props){
      let view=views.get(prop.id);
      if(!view){
        const root=new THREE.Group();root.quaternion.copy(camera.quaternion);scene.add(root);
        const size=prop.kind==='log'?1.3:.58;
        const texture=textures.get(prop.kind),height=size*texture.image.height/texture.image.width;
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
        mesh.position.y=prop.kind==='log'?.32:.18;root.add(mesh);
        const hit=new THREE.Mesh(new THREE.PlaneGeometry(prop.kind==='log'?1.1:.66,prop.kind==='log'?.8:.62),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));hit.position.y=.25;hit.userData.prop=prop.id;root.add(hit);
        const label=document.createElement('span');label.className='prop-label';label.hidden=true;viewport.append(label);
        view={root,mesh,hit,label};views.set(prop.id,view);
      }
      view.root.position.copy(position(prop.cell));view.root.visible=!prop.used;view.mesh.rotation.z=0;view.mesh.material.opacity=1;view.label.hidden=true;order(view);
    }
  }
  function labels(props,enabled,selected,canInteract){
    for(const prop of props){const view=views.get(prop.id);if(!view)continue;
      const available=enabled&&!prop.used&&canInteract(prop.id).ok;
      view.label.hidden=!available;view.label.classList.toggle('chosen',selected===prop.id);
      view.mesh.material.color.set(selected===prop.id?'#ffe8a1':available?'#fff2cf':'#ffffff');
      view.label.textContent=prop.kind==='log'?'Tronco · empurrar':canInteract(prop.id).pickup?'Pedra · recolher':'Pedra · arremessar';
    }
  }
  function tick(){for(const view of views.values())if(!view.label.hidden){const p=view.root.position.clone();p.y+=.7;p.project(camera);view.label.style.left=`${(p.x*.5+.5)*viewport.clientWidth}px`;view.label.style.top=`${(-p.y*.5+.5)*viewport.clientHeight}px`;}}
  return {views,position,sync,labels,tick,order,textures,heldRock};
}
