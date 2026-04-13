let selectedConnectionId: string | null = null;

export function getSelectedConnectionId() {
  return selectedConnectionId;
}

export function setSelectedConnectionId(id: string | null) {
  selectedConnectionId = id;
}
