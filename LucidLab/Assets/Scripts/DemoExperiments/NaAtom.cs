using UnityEngine;

public class NaAtom : MonoBehaviour
{
    [Tooltip("Partner chlorine ImageTarget (Cl or Cl (1)).")]
    public GameObject AtomImage;

    private float distanceReverse;

    void Start()
    {
        if (AtomImage == null)
            AtomImage = FindPartnerByName();
    }

    void Update()
    {
        if (AtomImage == null)
            return;

        distanceReverse = Vector3.Distance(AtomImage.transform.position, transform.position);
    }

    static GameObject FindPartnerByName()
    {
        var go = GameObject.Find("ImageTarget Cl (1)");
        if (go != null)
            return go;
        return GameObject.Find("ImageTarget Cl");
    }

    void OnTriggerEnter(Collider other)
    {
        if (other.gameObject.name == "ImageTarget Cl" || other.gameObject.name == "ImageTarget Cl (1)")
            AtomImage = other.gameObject;
    }
}
