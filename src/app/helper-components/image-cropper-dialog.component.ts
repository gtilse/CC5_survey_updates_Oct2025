import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Cropper from 'cropperjs';

@Component({
  selector: 'app-image-cropper-dialog',
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss']
})
export class ImageCropperDialogComponent implements OnInit {
  file: any = null;

  cropper: any = null;

  aspectRatio = null;

  constructor(
    public dialogRef: MatDialogRef<ImageCropperDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.aspectX && data.aspectY) {
      this.aspectRatio = data.aspectX / data.aspectY;
    }
  }

  ngOnInit() {}

  // Trigger file input click
  fileInputClickTrigger(event: any) {
    const element: HTMLElement = document.getElementById(
      'cropper-file-input'
    ) as HTMLElement;
    element.click();
  }

  // File change
  onFileChange(event: any) {
    const selectedFile = event.target.files[0];
    const reader = new FileReader();

    // Reader bind to load event
    reader.addEventListener(
      'load',
      (evt) => {
        this.file = reader.result;

        setTimeout(() => {
          const imageEl: HTMLImageElement = <HTMLImageElement>(
            document.getElementById('cropper-image')
          );

          this.cropper = new Cropper(imageEl, {
            aspectRatio: this.aspectRatio,
            ready() {},
            crop(e) {}
          });
        }, 100);
      },
      false
    );

    //
    if (selectedFile) {
      reader.readAsDataURL(selectedFile);
    }
  }

  // Select cropped image
  selectImage() {
    this.cropper.getCroppedCanvas().toBlob((blob) => {
      this.dialogRef.close({ file: blob });
    });
  }

  // Close modal
  closeModal() {
    this.dialogRef.close();
  }
}
