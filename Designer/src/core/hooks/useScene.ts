import { useFirestore, useFirestoreCollectionData, useFirestoreDocData } from 'reactfire';
import { ExportedNodes } from '../../components/logic_designer/node_exporter';
import { deleteDocument, patchDocument, setDocument } from '../../api/firestore';
import { deleteStoragePathApi, listMarkersApi, uploadMarkerApi } from '../../api/storage';
import {
  getSceneDocRef,
  getSceneObjectsCollectionRef
} from '../states/references';
import { AiChatMessage, SceneMarker, SceneObjectState } from '../states/types';

const MAX_AI_CHAT_MESSAGES = 40;

/** Rasterise an SVG File to a PNG Blob at the given pixel size. */
async function svgToPng(svgFile: File, size: number): Promise<Blob> {
  const svgText = await svgFile.text();
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load SVG as image')); };
    img.src = url;
  });
}

export interface SceneObjectInterface {
  object: SceneObjectState | undefined;
  setPosition: (position: [number, number, number]) => void;
  setRotation: (rotation: [number, number, number]) => void;
  setScale: (scale: [number, number, number]) => void;
  setHasGravity: (hasGravity: boolean) => void;
  setGrabbable: (isGrabbable: boolean) => void;
  setColor: (color: string) => void;
  deleteSelf: () => void;
  setShowDesc: (showDesc: boolean) => void;
  setMarkerId: (markerId: string) => void;
}

export default function useScene(expName: string, sceneName: string) {
  const fsapp = useFirestore();
  const { data: scene } = useFirestoreDocData(getSceneDocRef(fsapp, expName, sceneName));
  const { data: objects } = useFirestoreCollectionData(
    getSceneObjectsCollectionRef(fsapp, expName, sceneName),
  );

  function addObject(name: string, type: string) {
    const obj: SceneObjectState = {
      objectName: name,
      objectType: type,
      color: '#00FF00',
      position: [0, 0.28, 0],
      rotation: [0, 0, 0],
      scale: [0.08, 0.08, 0.08],
      hasGravity: false,
      isGrabbable: true,
      showDesc: true,
    };

    setDocument(`experiments/${expName}/scenes/${sceneName}/objects/${name}`, obj, false);
  }

  async function addMarker(name: string, file: File) {
    const defaultMarkers = scene?.markers ?? [];
    const markerId = `marker_${Date.now()}`;

    console.log(`[useScene] addMarker START: name='${name}', markerId='${markerId}', file=${file.name} (${file.size} bytes, ${file.type}), experiment='${expName}', scene='${sceneName}', existingMarkers=${defaultMarkers.length}`);

    try {
      // Convert SVG to PNG so Unity can decode the marker at runtime
      let uploadFile: File | Blob = file;
      if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        console.log('[useScene] SVG detected, converting to PNG...');
        uploadFile = await svgToPng(file, 756);
        console.log(`[useScene] Converted to PNG: ${uploadFile.size} bytes`);
      }

      console.log(`[useScene] Uploading marker through backend as '${markerId}'...`);
      const upload = await uploadMarkerApi(markerId, uploadFile);
      const publicUrl = upload.publicUrl;

      console.log(`[useScene] Supabase public URL: ${publicUrl}`);

      const newMarker: SceneMarker = {
        id: markerId,
        name,
        imageUrl: publicUrl,
      };

      // Update Firestore with marker metadata
      console.log(`[useScene] Writing marker to Firestore: experiments/${expName}/scenes/${sceneName}`, newMarker);
      await patchDocument(`experiments/${expName}/scenes/${sceneName}`, {
        markers: [...defaultMarkers, newMarker],
      });
      
      console.log(`[useScene] Marker added successfully: id='${markerId}', url='${publicUrl}'`);
    } catch (error) {
      console.error('[useScene] addMarker FAILED:', error);
      throw error;
    }
  }

  async function listMarkers() {
    const result = await listMarkersApi().catch((error) => {
      console.error('Error listing markers from backend:', error);
      return null;
    });
    if (!result) {
      return [];
    }
    return result.items ?? [];
  }

  async function deleteMarker(markerId: string) {
    try {
      await deleteStoragePathApi('markers', markerId).catch((error) => {
        console.error('Error deleting marker from backend storage:', error);
      });

      // Update Firestore to remove marker metadata
      const currentMarkers: SceneMarker[] = scene?.markers ?? [];
      const updatedMarkers = currentMarkers.filter(m => m.id !== markerId);
      await patchDocument(`experiments/${expName}/scenes/${sceneName}`, {
        markers: updatedMarkers,
      });
      
      console.log('Marker deleted successfully:', markerId);
    } catch (error) {
      console.error('Failed to delete marker:', error);
      throw error;
    }
  }

  function setSceneLogic(nodes: ExportedNodes) {
    patchDocument(`experiments/${expName}/scenes/${sceneName}`, {
      // @ts-ignore
      sceneLogic: nodes,
    });
  }

  function setDescription(description: string) {
    patchDocument(`experiments/${expName}/scenes/${sceneName}`, {
      description: description,
    });
  }

  function trimAiChat(messages: AiChatMessage[]): AiChatMessage[] {
    if (messages.length <= MAX_AI_CHAT_MESSAGES) return messages;
    return messages.slice(-MAX_AI_CHAT_MESSAGES);
  }

  function appendAiChatMessages(newMessages: AiChatMessage[]) {
    const current = (scene?.aiChat ?? []) as AiChatMessage[];
    const merged = trimAiChat([...current, ...newMessages]);
    patchDocument(`experiments/${expName}/scenes/${sceneName}`, {
      aiChat: merged,
    });
  }

  function setAiChat(messages: AiChatMessage[]) {
    patchDocument(`experiments/${expName}/scenes/${sceneName}`, {
      aiChat: trimAiChat(messages),
    });
  }

  function getObject(objectName: string): SceneObjectInterface {
    const object = objects?.find(object => object.objectName === objectName);

    function setPosition(position: [number, number, number]) {
      console.log('[useScene] setPosition', {
        expName,
        sceneName,
        objectName,
        position,
      });
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        position: position,
      });
    }

    function setScale(scale: [number, number, number]) {
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        scale: scale,
      });
    }

    function setRotation(rotation: [number, number, number]) {
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        rotation: rotation,
      });
    }

    function setHasGravity(hasGravity: boolean) {
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        hasGravity: hasGravity,
      });
    }

    function setGrabbable(isGrabbable: boolean) {
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        isGrabbable: isGrabbable,
      });
    }

    function setShowDesc(showDesc: boolean) {
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        showDesc: showDesc,
      });
    }

    function setColor(color: string) {
      console.log('[useScene] setColor', {
        expName,
        sceneName,
        objectName,
        color,
      });
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        color: color,
      });
    }

    function setMarkerId(markerId: string) {
      patchDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`, {
        markerId: markerId,
      });
    }

    function deleteSelf() {
      deleteDocument(`experiments/${expName}/scenes/${sceneName}/objects/${objectName}`);
    }

    return {
      object,
      setPosition,
      setRotation,
      setScale,
      setHasGravity,
      setGrabbable,
      setColor,
      deleteSelf,
      setShowDesc,
      setMarkerId,
    };
  }

  function addMarkerManual(marker: SceneMarker) {
    const defaultMarkers = scene?.markers ?? [];
    patchDocument(`experiments/${expName}/scenes/${sceneName}`, {
      markers: [...defaultMarkers, marker],
    });
  }

  return {
    scene,
    objects,
    addObject,
    addMarker,
    addMarkerManual,
    deleteMarker,
    listMarkers,
    setSceneLogic,
    getObject,
    setDescription,
    appendAiChatMessages,
    setAiChat,
  };
}
