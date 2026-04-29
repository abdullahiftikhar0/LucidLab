import { useContext, useEffect, useState } from 'react';
import { LucidLabContext } from '../../app';
import { listObjectTypesApi, uploadObjectTypeApi } from '../../api/storage';

export type ObjectType = {
  name: string;
  objFile: string;
  mtlFile?: string;
};

export type ObjectTypesManager = {
  objects: ObjectType[];
  uploadObject: (objName: string, objFile: Blob) => Promise<boolean>;
};

export function useObjectTypesManager(): ObjectTypesManager {
  const { username, loading } = useContext(LucidLabContext);
  const [objects, setObjects] = useState<ObjectType[]>([]);

  async function getObjects() {
    if (loading || !username) return {} as Record<string, ObjectType>;
    const result = await listObjectTypesApi().catch((error) => {
      console.error('Error fetching objects from backend:', error);
      return { items: [] };
    });

    const ret = {} as Record<string, ObjectType>;
    for (const item of result.items ?? []) {
      const name = item.name ?? item.id;
      if (!item.url) continue;
      ret[name] = {
        name,
        objFile: item.url,
      };
    }

    return ret;
  }

  function updateObjectsList() {
    getObjects().then((objects) => {
      let objsArr = [];
      for (const key in objects) {
        objsArr.push(objects[key]);
      }
      setObjects(objsArr);
    });
  }

  useEffect(() => {
    updateObjectsList();
  }, [username, loading]);

  async function uploadObject(objName: string, objFile: Blob) {
    if (!username) {
      console.error('Cannot upload object without username context');
      return false;
    }

    const upload = await uploadObjectTypeApi(objName, objFile).catch((error) => {
      console.error('Error uploading object to backend:', error);
      return null;
    });
    if (!upload?.publicUrl) {
      return false;
    }
    updateObjectsList();
    return true;
  }

  return {
    objects,
    uploadObject,
  };
}
