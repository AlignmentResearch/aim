import React from 'react';

import { Card, Text, Button, Icon, Spinner } from 'components/kit';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';
import BusyLoaderWrapper from 'components/BusyLoaderWrapper/BusyLoaderWrapper';
import { ICardProps } from 'components/kit/Card/Card.d';
import CopyToClipBoard from 'components/CopyToClipBoard/CopyToClipBoard';

import {
  IRunOverviewTabCSVTablesCardProps,
  CSVData,
} from './RunOverviewTabCSVTablesCard.d';

import './RunOverviewTabCSVTablesCard.scss';

function RunOverviewTabCSVTablesCard({
  artifacts,
  isRunInfoLoading,
}: IRunOverviewTabCSVTablesCardProps) {
  const [csvData, setCsvData] = React.useState<CSVData[]>([]);
  const [loadingStates, setLoadingStates] = React.useState<
    Record<string, boolean>
  >({});

  // Filter CSV artifacts
  const csvArtifacts = React.useMemo(() => {
    return artifacts.filter(
      (artifact) =>
        artifact.name.toLowerCase().endsWith('.csv') ||
        artifact.path.toLowerCase().endsWith('.csv'),
    );
  }, [artifacts]);

  // Function to parse CSV content
  const parseCSV = (
    csvText: string,
  ): { data: Array<Record<string, any>>; columns: string[] } => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
      return { data: [], columns: [] };
    }

    // Parse header
    const columns = lines[0]
      .split(',')
      .map((col) => col.trim().replace(/"/g, ''));

    // Parse data rows
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map((val) => val.trim().replace(/"/g, ''));
      const row: Record<string, any> = {};
      columns.forEach((col, colIndex) => {
        row[col] = values[colIndex] || '';
      });
      row._rowIndex = index; // Add row index for table key
      return row;
    });

    return { data, columns };
  };

  // Check if URI is a local file path
  const isLocalFile = (uri: string): boolean => {
    return (
      uri.startsWith('/') ||
      uri.startsWith('./') ||
      uri.startsWith('../') ||
      uri.includes(':\\') || // Windows paths like C:\
      uri.startsWith('file://')
    );
  };

  // Function to load CSV data
  const loadCSVData = async (artifact: {
    name: string;
    uri: string;
    path: string;
  }) => {
    const key = artifact.name;
    setLoadingStates((prev) => ({ ...prev, [key]: true }));

    try {
      let csvText: string;

      if (isLocalFile(artifact.uri) || isLocalFile(artifact.path)) {
        // For local files, use Aim's artifact serving API endpoint
        // Get the run ID from the current URL
        const pathParts = window.location.pathname.split('/');
        const runIdIndex = pathParts.findIndex((part) => part === 'runs');
        const runId = runIdIndex !== -1 ? pathParts[runIdIndex + 1] : null;

        if (!runId) {
          throw new Error('Could not determine run ID from current URL');
        }

        const artifactEndpoint = `/api/runs/${runId}/artifacts/${encodeURIComponent(
          artifact.name,
        )}/`;

        try {
          const response = await fetch(artifactEndpoint);
          if (!response.ok) {
            throw new Error(`Failed to fetch artifact: ${response.statusText}`);
          }
          csvText = await response.text();
        } catch (error) {
          throw new Error(
            `Cannot access local file: ${artifact.path}. ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      } else {
        // For HTTP URLs, use direct fetch
        const response = await fetch(artifact.uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        csvText = await response.text();
      }

      const { data, columns } = parseCSV(csvText);

      setCsvData((prev) => [
        ...prev.filter((csv) => csv.name !== artifact.name),
        {
          name: artifact.name,
          uri: artifact.uri,
          data,
          columns,
        },
      ]);
    } catch (error) {
      setCsvData((prev) => [
        ...prev.filter((csv) => csv.name !== artifact.name),
        {
          name: artifact.name,
          uri: artifact.uri,
          data: [],
          columns: [],
          error: error instanceof Error ? error.message : 'Failed to load CSV',
        },
      ]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Function to handle manual file upload for local files
  const handleFileUpload = async (artifact: {
    name: string;
    uri: string;
    path: string;
  }) => {
    const key = artifact.name;
    setLoadingStates((prev) => ({ ...prev, [key]: true }));

    try {
      // Create file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv';
      fileInput.style.display = 'none';

      // Handle file selection
      const filePromise = new Promise<File>((resolve, reject) => {
        fileInput.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            resolve(file);
          } else {
            reject(new Error('No file selected'));
          }
        };
        fileInput.oncancel = () =>
          reject(new Error('File selection cancelled'));
      });

      // Trigger file selection
      document.body.appendChild(fileInput);
      fileInput.click();

      const file = await filePromise;
      document.body.removeChild(fileInput);

      // Read file content
      const csvText = await file.text();
      const { data, columns } = parseCSV(csvText);

      setCsvData((prev) => [
        ...prev.filter((csv) => csv.name !== artifact.name),
        {
          name: artifact.name,
          uri: artifact.uri,
          data,
          columns,
        },
      ]);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !== 'File selection cancelled'
      ) {
        setCsvData((prev) => [
          ...prev.filter((csv) => csv.name !== artifact.name),
          {
            name: artifact.name,
            uri: artifact.uri,
            data: [],
            columns: [],
            error: error.message,
          },
        ]);
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Load CSV data on mount
  React.useEffect(() => {
    csvArtifacts.forEach((artifact) => {
      loadCSVData(artifact);
    });
  }, [csvArtifacts]);

  // Render individual CSV table
  const renderCSVTable = (csv: CSVData) => {
    const tableColumns = csv.columns.map((column) => ({
      dataKey: column,
      key: column,
      title: column,
      width: `${100 / csv.columns.length}%`,
      cellRenderer: ({ cellData }: any) => <p title={cellData}>{cellData}</p>,
    }));

    const dataListProps: ICardProps['dataListProps'] = {
      tableColumns,
      tableData: csv.data,
      calcTableHeight: false,
      searchableKeys: csv.columns,
      illustrationConfig: {
        size: 'medium',
        title: 'No Data',
      },
    };

    const artifact = csvArtifacts.find((a) => a.name === csv.name);
    const isLocalFileError = csv.error?.includes('Cannot access local file');

    return (
      <div key={csv.name} className='RunOverviewTabCSVTablesCard__csvTable'>
        <div className='RunOverviewTabCSVTablesCard__csvTable__header'>
          <div className='RunOverviewTabCSVTablesCard__csvTable__header__title'>
            <Icon name='menu' />
            <Text weight={600} size={16}>
              {csv.name}
            </Text>
            {csv.data.length > 0 && (
              <Text size={12} tint={50}>
                ({csv.data.length} rows, {csv.columns.length} columns)
              </Text>
            )}
          </div>
          <div className='RunOverviewTabCSVTablesCard__csvTable__header__actions'>
            <CopyToClipBoard iconSize='small' copyContent={csv.uri} />
            {isLocalFileError && artifact && (
              <Button
                size='small'
                variant='outlined'
                onClick={() => handleFileUpload(artifact)}
                disabled={loadingStates[csv.name]}
              >
                <Icon name='upload' />
                <Text size={12}>Load File</Text>
              </Button>
            )}
            <Button
              size='small'
              variant='outlined'
              onClick={() => window.open(csv.uri, '_blank')}
            >
              <Icon name='new-tab' />
            </Button>
          </div>
        </div>

        {loadingStates[csv.name] ? (
          <div className='RunOverviewTabCSVTablesCard__csvTable__loading'>
            <Spinner size={24} />
          </div>
        ) : csv.error ? (
          <div className='RunOverviewTabCSVTablesCard__csvTable__error'>
            <Icon name='warning-outline' />
            <Text size={14}>{csv.error}</Text>
            {isLocalFileError && (
              <Text size={12} tint={50} style={{ marginTop: '0.5rem' }}>
                Click "Load File" to manually select and upload this CSV file.
              </Text>
            )}
          </div>
        ) : (
          <div className='RunOverviewTabCSVTablesCard__csvTable__tableContainer'>
            <Card title='' dataListProps={dataListProps} />
          </div>
        )}
      </div>
    );
  };

  // Don't render if no CSV artifacts
  if (csvArtifacts.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary>
      <BusyLoaderWrapper isLoading={isRunInfoLoading} height='100%'>
        <Card
          title='CSV Tables'
          subtitle={`${csvArtifacts.length} CSV file${
            csvArtifacts.length !== 1 ? 's' : ''
          } found`}
          className='RunOverviewTabCSVTablesCard RunOverviewTab__cardBox'
        >
          {csvData.length > 0 ? (
            csvData.map(renderCSVTable)
          ) : (
            <div className='RunOverviewTabCSVTablesCard__csvTable__loading'>
              <Spinner size={24} />
              <Text size={14} tint={50} style={{ marginLeft: '0.5rem' }}>
                Loading CSV data...
              </Text>
            </div>
          )}
        </Card>
      </BusyLoaderWrapper>
    </ErrorBoundary>
  );
}

RunOverviewTabCSVTablesCard.displayName = 'RunOverviewTabCSVTablesCard';

export default React.memo<IRunOverviewTabCSVTablesCardProps>(
  RunOverviewTabCSVTablesCard,
);
