import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from "../../utils/api.js";

function FileList({ path = "/", onDelete }) {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    async function fetchList() {
      const dataList = await api.getFileList(path);
      setFiles(dataList);
    }
    fetchList();
  }, [path]);

  const handleFolderClick = folder => {
    setCurrentPath(currentPath + folder);
    async function fetchList() {
      const dataList = await api.getFileList(`${currentPath}${folder}`);
      setFiles(dataList);
    }
    fetchList();
  };

  const handleDeleteClick = () => {
    const selectedFiles = files.filter(file => file.selected);
    onDelete(selectedFiles);
  };

  const handleCheckboxClick = (event, file) => {
    const updatedFiles = files.map(f => {
      if (f.id === file.id) {
        return { ...f, selected: event.target.checked };
      }
      return f;
    });
    setFiles(updatedFiles);
  };

  const renderFile = file => (
    <div key={file.id}>
      <input type="checkbox" checked={file.selected} onChange={event => handleCheckboxClick(event, file)} />
      {file.type === 'folder' ? (
        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleFolderClick(file.name)}>
          {file.name}
        </span>
      ) : (
        <span>{file.name}</span>
      )}
    </div>
  );

  return (
    <div>
      <div>{currentPath}</div>
      <button onClick={handleDeleteClick}>Delete Selected</button>
      {files.map(file => renderFile(file))}
    </div>
  );
}

FileList.propTypes = {
  path: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default FileList;
