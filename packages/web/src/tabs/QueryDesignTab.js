import React from 'react';
import _ from 'lodash';
import ReactDOM from 'react-dom';
import axios from '../utility/axios';

import { useConnectionInfo } from '../utility/metadataLoaders';
import SqlEditor from '../sqleditor/SqlEditor';
import { useUpdateDatabaseForTab, useSetOpenedTabs } from '../utility/globalState';
import QueryToolbar from '../query/QueryToolbar';
import SocketMessagesView from '../query/SocketMessagesView';
import { TabPage } from '../widgets/TabControl';
import ResultTabs from '../sqleditor/ResultTabs';
import { VerticalSplitter } from '../widgets/Splitter';
import keycodes from '../utility/keycodes';
import { changeTab } from '../utility/common';
import useSocket from '../utility/SocketProvider';
import SaveTabModal from '../modals/SaveTabModal';
import useModalState from '../modals/useModalState';
import sqlFormatter from 'sql-formatter';
import useEditorData from '../utility/useEditorData';
import applySqlTemplate from '../utility/applySqlTemplate';
import LoadingInfo from '../widgets/LoadingInfo';
import useExtensions from '../utility/useExtensions';
import QueryDesigner from '../designer/QueryDesigner';

export default function QueryDesignTab({
  tabid,
  conid,
  database,
  initialArgs,
  tabVisible,
  toolbarPortalRef,
  ...other
}) {
  const [sessionId, setSessionId] = React.useState(null);
  const [executeNumber, setExecuteNumber] = React.useState(0);
  const setOpenedTabs = useSetOpenedTabs();
  const socket = useSocket();
  const [busy, setBusy] = React.useState(false);
  const saveFileModalState = useModalState();
  const extensions = useExtensions();
  const { editorData, setEditorData, isLoading } = useEditorData({
    tabid,
    loadFromArgs:
      initialArgs && initialArgs.sqlTemplate
        ? () => applySqlTemplate(initialArgs.sqlTemplate, extensions, { conid, database, ...other })
        : null,
  });

  const editorRef = React.useRef(null);

  const handleSessionDone = React.useCallback(() => {
    setBusy(false);
  }, []);

  React.useEffect(() => {
    if (sessionId && socket) {
      socket.on(`session-done-${sessionId}`, handleSessionDone);
      return () => {
        socket.off(`session-done-${sessionId}`, handleSessionDone);
      };
    }
  }, [sessionId, socket]);

  React.useEffect(() => {
    changeTab(tabid, setOpenedTabs, (tab) => ({ ...tab, busy }));
  }, [busy]);

  useUpdateDatabaseForTab(tabVisible, conid, database);
  const connection = useConnectionInfo({ conid });

  const handleExecute = async () => {
    if (busy) return;
    setExecuteNumber((num) => num + 1);
    const selectedText = editorRef.current.editor.getSelectedText();

    let sesid = sessionId;
    if (!sesid) {
      const resp = await axios.post('sessions/create', {
        conid,
        database,
      });
      sesid = resp.data.sesid;
      setSessionId(sesid);
    }
    setBusy(true);
    await axios.post('sessions/execute-query', {
      sesid,
      sql: selectedText || editorData,
    });
  };

  const handleCancel = () => {
    axios.post('sessions/cancel', {
      sesid: sessionId,
    });
  };

  const handleKill = () => {
    axios.post('sessions/kill', {
      sesid: sessionId,
    });
    setSessionId(null);
    setBusy(false);
  };

  const handleKeyDown = (data, hash, keyString, keyCode, event) => {
    if (keyCode == keycodes.f5) {
      event.preventDefault();
      handleExecute();
    }
  };

  if (isLoading) {
    return (
      <div>
        <LoadingInfo message="Loading SQL script" />
      </div>
    );
  }

  return (
    <>
      <VerticalSplitter>
        <QueryDesigner
          value={editorData || ''}
          conid={conid}
          database={database}
          engine={connection && connection.engine}
          onChange={setEditorData}
          onKeyDown={handleKeyDown}
        ></QueryDesigner>
        {sessionId && (
          <ResultTabs sessionId={sessionId} executeNumber={executeNumber}>
            <TabPage label="Messages" key="messages">
              <SocketMessagesView
                eventName={sessionId ? `session-info-${sessionId}` : null}
                executeNumber={executeNumber}
              />
            </TabPage>
          </ResultTabs>
        )}
      </VerticalSplitter>
      {/* {toolbarPortalRef &&
        toolbarPortalRef.current &&
        tabVisible &&
        ReactDOM.createPortal(
          <QueryToolbar
            isDatabaseDefined={conid && database}
            execute={handleExecute}
            busy={busy}
            cancel={handleCancel}
            format={handleFormatCode}
            save={saveFileModalState.open}
            isConnected={!!sessionId}
            kill={handleKill}
          />,
          toolbarPortalRef.current
        )} */}
      <SaveTabModal
        modalState={saveFileModalState}
        tabVisible={tabVisible}
        data={editorData}
        format="json"
        folder="query"
        tabid={tabid}
      />
    </>
  );
}

QueryDesignTab.allowAddToFavorites = (props) => true;