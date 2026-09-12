import clsx from 'clsx';
import get from 'lodash.get';
import { Upload } from 'lucide-react';
import * as React from 'react';
import type { Accept, DropzoneOptions, FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';

import { ErrorMessage } from '@/components/error-message';
import { FilePreview } from '@/components/file-preview';
import { HelperText } from '@/components/helper-text';
import { Label } from '@/components/label';

import type { FileWithPreview } from '@/types/dropzone';

export type DropzoneInputProps = {
  accept?: Accept;
  helperText?: string;
  id: string;
  label: string | null;
  maxFiles?: number;
  readOnly?: boolean;
  hideError?: boolean;
  validation?: Record<string, unknown>;
  containerClassName?: string;
  labelTextClassName?: string;
  helperTextClassName?: string;
  defaultValue?: FileWithPreview | FileWithPreview[];
} & Partial<DropzoneOptions>;

const DEFAULT_MAX_SIZE = 5_000_000;

const DropzoneInput = ({
  accept,
  helperText = '',
  id,
  label,
  maxFiles = 1,
  validation,
  readOnly,
  hideError = false,
  containerClassName,
  labelTextClassName,
  helperTextClassName,
  defaultValue,
  ...dropzoneOptions
}: DropzoneInputProps) => {
  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();
  const error = get(errors, id);
  const withLabel = label !== null;

  //#region  //*=========== Error Focus ===========
  const dropzoneRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (error) dropzoneRef.current?.focus();
  }, [error]);
  //#endregion  //*======== Error Focus ===========

  //#region  //*=========== Sync Files With RHF ===========
  const fileValue = getValues(id);
  const [files, setFiles] = React.useState<FileWithPreview[]>(fileValue || []);

  React.useEffect(() => {
    setFiles(fileValue || []);
  }, [fileValue]);
  //#endregion  //*======== Sync Files With RHF ===========

  const onDrop = React.useCallback(
    <T extends File>(acceptedFiles: T[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        // keep existing files in form state
        setValue(id, files ? [...files] : null);

        const firstError = rejectedFiles[0].errors[0];
        let message = firstError.message;

        if (firstError.code === 'file-too-large') {
          message = `File is too large, maximum ${
            (dropzoneOptions.maxSize || DEFAULT_MAX_SIZE) / 1_000_000
          }MB`;
        } else if (firstError.code === 'too-many-files') {
          message = `Maximum ${maxFiles} files allowed`;
        } else if (firstError.code === 'file-invalid-type') {
          message = message.replace(
            'File type must be',
            'Allowed file extensions are',
          );
        }

        setError(id, {
          type: 'manual',
          message,
        });
      } else {
        const acceptedFilesPreview = acceptedFiles.map((file: T) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          }),
        );

        const existing = files || [];
        const nextFiles = [...existing, ...acceptedFilesPreview].slice(
          0,
          maxFiles,
        );
        const nextValue = [...existing, ...acceptedFiles].slice(0, maxFiles);

        setFiles(nextFiles);
        setValue(id, nextValue, {
          shouldValidate: true,
        });
        clearErrors(id);
      }
    },
    [
      clearErrors,
      dropzoneOptions.maxSize,
      files,
      id,
      maxFiles,
      setError,
      setValue,
    ],
  );

  // Cleanup previews on unmount only
  React.useEffect(() => {
    return () => {
      if (files) {
        files.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      }
      // we intentionally don't depend on `files` here
       
    };
  }, []);

  const deleteFile = (
    e: React.MouseEvent<HTMLButtonElement>,
    file: FileWithPreview,
  ) => {
    e.preventDefault();

    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }

    const newFiles = files.filter((f) => f !== file);

    if (newFiles.length > 0) {
      setFiles(newFiles);
      setValue(id, newFiles, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      setFiles([]);
      setValue(id, null, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize: dropzoneOptions.maxSize || DEFAULT_MAX_SIZE,
    ...dropzoneOptions,
  });

  return (
    <div className={containerClassName}>
      {withLabel ? (
        <Label
          required={validation?.required ? true : false}
          className={labelTextClassName}
        >
          {label}
        </Label>
      ) : null}

      {readOnly && !(files.length > 0) ? (
        <div className='mt-1 divide-y divide-input rounded-lg border border-input py-3 pl-3 pr-4 text-sm'>
          Tidak ada file yang diupload
        </div>
      ) : files.length >= maxFiles ? (
        <ul
          className={clsx([
            'divide-y divide-input rounded-lg border border-input',
            withLabel && 'mt-1',
          ])}
        >
          {files.map((file, index) => (
            <FilePreview
              deleteFile={deleteFile}
              file={file}
              key={index}
              readOnly={readOnly}
            />
          ))}
        </ul>
      ) : (
        <Controller
          control={control}
          defaultValue={defaultValue}
          name={id}
          render={() => (
            <>
              <div
                className={clsx([
                  'focus:ring-dark-400 group focus:outline-none border-2 border-dashed rounded-lg border-input group-focus:border-4',
                  withLabel && 'mt-1',
                  error && 'border-red-500 group-focus:border-red-500',
                ])}
                {...getRootProps()}
                ref={dropzoneRef}
              >
                <input {...getInputProps()} />
                <div
                  className={clsx(
                    'w-full cursor-pointer rounded-lg px-2 py-8',
                    error
                      ? 'dropzone-border-dash-error border-red-500 group-focus:border-red-500'
                      : 'dropzone-border-dash group-focus:border-primary-500',
                  )}
                >
                  <div className='space-y-3 text-center'>
                    <Upload
                      aria-hidden='true'
                      className='text-muted-foreground mx-auto h-8 w-8'
                    />
                    <p className='text-muted-foreground'>
                      Select or drag and drop files here to upload
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {`${maxFiles - (files.length || 0)} files left`}
                    </p>
                  </div>
                </div>
              </div>

              {!hideError && error ? (
                <ErrorMessage className='mt-2'>
                  {String(error.message)}
                </ErrorMessage>
              ) : null}
              {helperText ? (
                <HelperText
                  helperTextClassName={cn('mt-2', helperTextClassName)}
                >
                  {helperText}
                </HelperText>
              ) : null}
              {!readOnly && Boolean(files.length) && (
                <ul className='divide-border mt-1 divide-y rounded-lg border'>
                  {files.map((file, index) => (
                    <FilePreview
                      deleteFile={deleteFile}
                      file={file}
                      key={index}
                      readOnly={readOnly}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
          rules={validation}
        />
      )}
    </div>
  );
};
DropzoneInput.displayName = 'DropzoneInput';

export { DropzoneInput };
