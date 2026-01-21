/*!

=========================================================
* Black Dashboard React v1.2.2
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import axios from "axios";
import classNames from "classnames";
import React , { useState , useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import NotificationAlert from "react-notification-alert";
import Settings from "./Settings";

// reactstrap components
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
} from "reactstrap";

function Dashboard(props) {
  
  const backendUrl = process.env.REACT_APP_API_URL;
  // NOTIFICATION
  const { notify } = props
  // const [notifications, setNotifications] = useState([]);
  // const notificationAlertRef = useRef(null);

  // const notify = (type, message) => {
  //   const options = {
  //     place: "tr", // bottom right
  //     message: (
  //       <div>
  //         <div>
  //           <b>
  //             {type === "success" ? "Success - " : 
  //              type === "danger" ? "Error - " : 
  //              type === "info" ? "" : ""}
  //           </b>
  //           {message}
  //         </div>
  //       </div>
  //     ),
  //     type: type, // "success" or "danger"
  //     icon: type === "info" ? "tim-icons icon-notes" : "tim-icons icon-bell-55",
  //     autoDismiss: 5,
  //   };
  //   notificationAlertRef.current.notificationAlert(options);
    
  //   // Save plain text notification for the navbar dropdown
  //   const plainMessage =
  //     (type === "success" ? "Success - " :
  //     type === "danger" ? "Error - " :
  //     type === "info" ? "" : "") + message;

  //   setNotifications((prev) => {
  //     const updated = [...prev, plainMessage];
  //     return updated.slice(-10); // Keep max 10 latest
  //   });
  // };  
  useEffect(() => {
    const initialize = async () => {
      notify("info", "Cleaning up previous files...");
      notify("info", "Loading Color Cast Removal Model...");
      // 1. Trigger cleanup
      fetch(`${backendUrl}/api/cleanup`, { method: 'POST' })
      .then(res => res.json())
      .then(data => console.log("Cleanup response:", data))
      .catch(err => console.error("Cleanup error:", err));
      notify("success", "Cleanup complete.");

      // 2. Trigger model initialization
      fetch(`${backendUrl}/api/init_model`, { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log("Init model response:", data))
        .catch(err => console.error("Init model error:", err));
      notify("success", "Model initialization complete.")
    };
    initialize();
  }, [backendUrl]); // Runs only once on page load/refresh

  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState(null);
  const [processedImageUrl, setProcessedImageUrl] = React.useState(null);
  const [processedFilename, setProcessedFilename] = React.useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);

  // HISTORY
  const [imageHistory, setImageHistory] = useState([]);
  
  // ADJUSTMENT
  const [viewMode, setViewMode] = useState("processed");
  const [adjustParams, setAdjustParams] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0
  });
  const [adjustedImageUrl, setAdjustedImageUrl] = useState(null);
  const [hasAdjusted, setHasAdjusted] = useState(false);
  
  const handleAdjustChange = async (param, value) => {
    const newParams = { ...adjustParams, [param]: value };
    setAdjustParams(newParams);
    
    if (!uploadedImage) return;
    if (!hasAdjusted) setHasAdjusted(true);
    
    const formData = new FormData();
    formData.append('image', processedBlob);
    formData.append('brightness', newParams.brightness);
    formData.append('contrast', newParams.contrast);
    formData.append('saturation', newParams.saturation);
    formData.append('temperature', newParams.temperature);
    
    try {
      const adjustResponse = await axios.post(`${backendUrl}/api/adjust`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob", // key part
      });
      
      const blob = adjustResponse.data;
      const blobUrl = URL.createObjectURL(blob);
      setAdjustedImageUrl(blobUrl);
      
      // Auto-switch to adjusted view
      if (viewMode !== "adjusted") {
        setViewMode("adjusted");
      }
      
    } catch (error) {
      console.error("Adjustment failed:", error);
      notify("danger", "Image adjustment failed.");
    }
  };
  
  
  // UPLOAD
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(file); // Save file for later processing
      const localUrl = URL.createObjectURL(file);
      setUploadedImageUrl(localUrl);

      // Clear previous output & adjustments
      setProcessedImageUrl(null);
      setAdjustedImageUrl(null);
      setHasAdjusted(false);
      setViewMode("processed");
      setAdjustParams({ brightness: 0, contrast: 0, saturation: 0, temperature: 0 });
      setProgress(0);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    handleImageUpload({ target: { files: e.dataTransfer.files } });
  };

  // PROCESS
  const handleProcessImage = async () => {
    if (!uploadedImage) return;

    if (imageHistory.length >= 10) {
      notify("danger", "Image upload limit reached (max 10 images).");
      return;
    }  

    const formData = new FormData();
    formData.append("image", uploadedImage);

    setIsProcessing(true);
    setProgress(10);

    notify("info", `Processing image: ${uploadedImage.name}`);
  
    try {
      // const response = await axios.post(`${backendUrl}/api/process`, formData, {
        const response = await axios.post(`${backendUrl}/api/inference`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
        onUploadProgress: (progressEvent) => {
          // Calculate the percentage and cap it at 90%
          const percentCompleted = Math.min(
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
            90
          );
          setProgress(percentCompleted);
        },
      });
      console.log("Got the response")
      const afterBlob = response.data;
      setProcessedBlob(afterBlob);
      console.log("Received Blob:", afterBlob);
      // Extract filename from Content-Disposition header
      const disposition = response.headers["content-disposition"];
      console.log("disposition", disposition)
      let filename = "processed_image.png"; // fallback
      if (disposition) {
        const filenameRegex = /filename[^;=\n]*=(['"]?)([^'"\n]*)\1/;
        const match = disposition.match(filenameRegex);
        if (match && match[2]) {
          filename = match[2];
        }
      }
      const afterUrl = URL.createObjectURL(afterBlob);
      // const { after_url } = response.data; // gcs bucket url
      setProcessedImageUrl(afterUrl); // after_url
      setProcessedFilename(filename)
      setProgress(100); // complete  
      notify("success", `Image ${uploadedImage.name} processed successfully.`);
      setImageHistory(prev => [...prev, {
        name: uploadedImage.name,
        before: uploadedImageUrl,
        after: afterUrl
      }]);
      // Fetch processed image for histogram
      try {
        const fetchResponse = await fetch(afterUrl, { mode: "cors" });
        if (!fetchResponse.ok) {
          throw new Error(`Failed to fetch processed image: ${fetchResponse.statusText}`);
        }
        const blob = await fetchResponse.blob();
        const processedFile = new File([blob], "processed.png", { type: blob.type });
        await fetchHistograms(uploadedImage, processedFile);
      } catch (fetchError) {
        console.error("Failed to fetch processed image for histogram:", fetchError);
        notify("danger", "Failed to load processed image for histogram generation.");
      }
    } catch (error) {
      console.error("Processing failed:", error);
      setProcessedImageUrl(uploadedImageUrl);
      setProgress(0);
      notify("danger", `Image processing failed for ${uploadedImage.name}.`);
    } finally {
      // setTimeout(() => setIsProcessing(false), 5000);
      setTimeout(()=> setIsProcessing(false));
    }
  };

  // HISTOGRAM
  const [inputHistogram, setInputHistogram] = useState(null);
  const [outputHistogram, setOutputHistogram] = useState(null);
  const [showSplitHistograms, setShowSplitHistograms] = useState(false);

  const fetchHistograms = async (original, processed) => {
    const formDataOriginal = new FormData();
    formDataOriginal.append("image", original);

    const formDataProcessed = new FormData();
    formDataProcessed.append("image", processed);

    try {
      const [originalRes, processedRes] = await Promise.all([
        axios.post(`${backendUrl}/api/histogram`, formDataOriginal),
        axios.post(`${backendUrl}/api/histogram`, formDataProcessed),
      ]);
      setInputHistogram(originalRes.data);
      setOutputHistogram(processedRes.data);
    } catch (err) {
      console.error("Error fetching histograms:", err);
    }
  };

  const histogramOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Pixel Intensity', color: '#ccc' },
      },
      y: {
        title: { display: true, text: 'Frequency', color: '#ccc' },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#ccc',
        },
      },
    },
  };

  return (
    <>
      <div className="content">
        <Row>
          <Col lg="4" md="12">
            <Card>
              <CardHeader>
                <Row className="align-items-center">
                  <Col>
                    <CardTitle tag="h3">Upload Image</CardTitle>
                  </Col>
                  <Col className="text-right">
                    <Button onClick={() => document.getElementById("fileInput").click()}>
                      <span className="d-none d-sm-inline">Upload</span>
                      <span className="d-inline d-sm-none">
                        <i className="tim-icons icon-upload" />
                      </span>
                    </Button>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <div style={{
                  border: "2px dashed #ccc",
                  borderRadius: "10px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  height: "300px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileInput").click()}
              >
                {uploadedImageUrl ? (
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <p>Drag & Drop or Click to Upload</p>
                )}
              </div>
              {uploadedImage && (
                <div className="text-center mt-2 text-muted">
                  Filename: <strong>{uploadedImage.name}</strong>
                </div>
              )}
              <Button onClick={handleProcessImage} color="primary" className="mt-3 w-100">
                Process
              </Button>
              </CardBody>
            </Card>
          </Col>
          <Col lg="8" md="12">
            <Card>
              <CardHeader>
                <Row className="align-items-center">
                    <Col>
                      <CardTitle tag="h2">Color Cast Removal</CardTitle>
                    </Col>
                    <Col className="text-right">
                      <ButtonGroup className="btn-group-toggle mb-3" data-toggle="buttons">
                        <Button
                          tag="label"
                          color="info"
                          size="sm"
                          className={classNames("btn-simple", { active: viewMode === "processed" })}
                          onClick={() => setViewMode("processed")}
                          disabled={!processedImageUrl}
                          >
                          <span className="d-none d-sm-block d-md-block">View Processed</span>
                          <span className="d-block d-sm-none">
                            <i className="tim-icons icon-image-02" />
                          </span>
                        </Button>
                        <Button
                          tag="label"
                          color="info"
                          size="sm"
                          className={classNames("btn-simple", { active: viewMode === "adjusted" })}
                          onClick={() => setViewMode("adjusted")}
                          disabled={!hasAdjusted || !adjustedImageUrl}
                          >
                          <span className="d-none d-sm-block d-md-block">View Adjusted</span>
                          <span className="d-block d-sm-none">
                            <i className="tim-icons icon-settings" />
                          </span>
                        </Button>
                      </ButtonGroup>
                    </Col>
                  </Row>
                </CardHeader>
              <CardBody>
                <div
                  style={{
                    border: "2px dashed #ccc",
                    borderRadius: "10px",
                    padding: "20px",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {/* <OutputImage
                    processedImageUrl={processedImageUrl}
                    adjustedImageUrl={adjustedImageUrl}
                    mode={viewMode}
                  /> */}
                  {viewMode === 'processed' && processedImageUrl ? (
                    <img
                      src={processedImageUrl}
                      alt="Processed"
                      style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }}
                    />
                  ) : viewMode === 'adjusted' && adjustedImageUrl ? (
                    <img
                      src={adjustedImageUrl}
                      alt="Adjusted"
                      style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }}
                    />
                  ) : (
                    <p>No {viewMode} image yet</p>
                  )}
                </div>
                {processedImageUrl && processedFilename && (
                  <div className="text-center mt-2 text-muted">
                    Filename: <strong>{processedFilename}</strong>
                  </div>
                )}
                <Row className="mt-3 px-3 w-100">
                  <Col xs="12">
                    <div className="progress" style={{ height: "10px", width: "100%" }}>
                      <div
                        className={`progress-bar ${isProcessing ? "progress-bar-striped progress-bar-animated" : ""} bg-info`}
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-right">
                      <small>{progress}%</small>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          </Row>
          <Row>
            <Card>
              <CardHeader>
                <Row className="align-items-center">
                  <Col>
                    <h5 className="card-category">Further edit image before download</h5>
                    <CardTitle tag="h4">Adjustments</CardTitle>
                  </Col>
                  <Col className="text-right">
                    <Button
                      size="sm"
                      color="warning"
                      onClick={() => {
                        setAdjustedImageUrl(processedImageUrl)
                        setAdjustParams({ brightness: 0, contrast: 0, saturation: 0, temperature: 0 });
                      }}
                      disabled={!processedImageUrl} // Optional: disable when no image
                    >
                    <i className="tim-icons icon-refresh-01 d-inline d-sm-none" /> {/* Show icon only on small screens */}
                    <span className="d-none d-sm-inline">Reset</span>
                    </Button>
                  </Col>
                  <Col className="text-right">
                    <Button
                        color="success"
                        href={viewMode === "adjusted" ? adjustedImageUrl : processedImageUrl}
                        download
                        disabled={
                          viewMode === "adjusted"
                            ? !adjustedImageUrl
                            : !processedImageUrl
                        }
                      >
                      <span className="d-none d-sm-block d-md-block">Download Image</span>
                      <span className="d-block d-sm-none">
                        <i className="tim-icons icon-cloud-download-93" />
                      </span>
                    </Button>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {/* ─── SETTINGS ──────── */}
                <Settings settings={adjustParams} onChange={handleAdjustChange} />
              </CardBody>
            </Card>
          </Row>
        <Row>
          {/* <Col lg="4" md="12"> */}
          <Card id="rgb-histogram" className="card-chart">
          <CardHeader>
            <Row>
              <Col className="text-left" sm="6">
                <h5 className="card-category">Color Distribution</h5>
                <CardTitle tag="h2">RGB Histograms</CardTitle>
              </Col>
              <Col className="text-right" sm="6">
                <Button
                  size="sm"
                  color="info"
                  onClick={() => setShowSplitHistograms(!showSplitHistograms)}
                  disabled={!processedImageUrl}
                >
                  {showSplitHistograms ? "Show Merged Histogram" : "Show Split Histogram"}
                </Button>
              </Col>
            </Row>
          </CardHeader>
          <CardBody>
              {!showSplitHistograms ? (
                // Merged View
              <div className="chart-area" style={{ height: "400px", padding: "1rem" }}>
                <Bar
                  data={{
                    labels: Array.from({ length: 256 }, (_, i) => i),
                    datasets: [
                      {
                        label: "Red (Input)",
                        data: inputHistogram?.r || [],
                        backgroundColor: "rgba(255, 99, 132, 0.9)",
                      },
                      {
                        label: "Green (Input)",
                        data: inputHistogram?.g || [],
                        backgroundColor: "rgba(75, 192, 192, 0.9)",
                      },
                      {
                        label: "Blue (Input)",
                        data: inputHistogram?.b || [],
                        backgroundColor: "rgba(54, 162, 235, 0.9)",
                      },
                      {
                        label: "Red (Output)",
                        data: outputHistogram?.r || [],
                        backgroundColor: "rgba(255, 99, 132, 0.9)",
                      },
                      {
                        label: "Green (Output)",
                        data: outputHistogram?.g || [],
                        backgroundColor: "rgba(75, 192, 192, 0.9)",
                      },
                      {
                        label: "Blue (Output)",
                        data: outputHistogram?.b || [],
                        backgroundColor: "rgba(54, 162, 235, 0.9)",
                      },
                    ],
                  }}
                  options={histogramOptions}
                />
              </div>
              ) : (
                // Split View
                <Row>
                  <Col md="6">
                    <h5 className="text-center text-muted">Input Image</h5>
                    <div className="chart-area" style={{ height: "300px" }}>
                    <Bar
                      data={{
                        labels: Array.from({ length: 256 }, (_, i) => i),
                        datasets: [
                          {
                            label: "Red",
                            data: inputHistogram?.r || [],
                            backgroundColor: "rgba(255, 99, 132, 0.9)",
                          },
                          {
                            label: "Green",
                            data: inputHistogram?.g || [],
                            backgroundColor: "rgba(75, 192, 192, 0.9)",
                          },
                          {
                            label: "Blue",
                            data: inputHistogram?.b || [],
                            backgroundColor: "rgba(54, 162, 235, 0.9)",
                          },
                        ],
                      }}
                      options={histogramOptions}
                    />
                    </div>
                  </Col>
                  <Col md="6">
                    <h5 className="text-center text-muted">Output Image</h5>
                    <div className="chart-area" style={{ height: "300px" }}>
                    <Bar
                      data={{
                        labels: Array.from({ length: 256 }, (_, i) => i),
                        datasets: [
                          {
                            label: "Red",
                            data: outputHistogram?.r || [],
                            backgroundColor: "rgba(255, 99, 132, 0.9)",
                          },
                          {
                            label: "Green",
                            data: outputHistogram?.g || [],
                            backgroundColor: "rgba(75, 192, 192, 0.9)",
                          },
                          {
                            label: "Blue",
                            data: outputHistogram?.b || [],
                            backgroundColor: "rgba(54, 162, 235, 0.9)",
                          },
                        ],
                      }}
                      options={histogramOptions}
                    />
                    </div>
                  </Col>
                </Row>
              )}
          </CardBody>
          </Card>
        </Row>
        <Row>
          <Card id="history">
              <CardHeader>
                <Row>
                  <Col className="text-left" sm="6">
                    <h5 className="card-category">Last 10 Processed Images</h5>
                    <CardTitle tag="h2">History</CardTitle>
                  </Col>
                  <Col className="text-right">
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => setImageHistory([])}
                      disabled={imageHistory.length === 0}
                    >
                      Clear History
                    </Button>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {imageHistory.length === 0 ? (
                  <p className="text-muted">No images processed yet.</p>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th className="filename-cell">Filename</th>
                        <th>Before</th>
                        <th>After</th>
                        <th style={{ width: "50px" }}></th> {/* Empty header for download button */}
                      </tr>
                    </thead>
                    <tbody>
                      {imageHistory.map((img, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td className="filename-cell">{img.name}</td>
                          <td>
                            <img src={img.before} alt="before" width="100" />
                          </td>
                          <td>
                            <img src={img.after} alt="after" width="100" />
                          </td>
                          <td>
                            <Button
                              color="success"
                              size="sm"
                              href={img.after}
                              download
                              disabled={!img.after}
                            >
                            <span className="d-none d-sm-block d-md-block">Download</span>
                            <span className="d-block d-sm-none">
                              <i className="tim-icons icon-cloud-download-93" />
                            </span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
        </Row>
        {/* <Row>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Total Shipments</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-bell-55 text-info" /> 763,215
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={chartExample2.data}
                    options={chartExample2.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Daily Sales</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-delivery-fast text-primary" />{" "}
                  3,500€
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Bar
                    data={chartExample3.data}
                    options={chartExample3.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Completed Tasks</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-send text-success" /> 12,100K
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={chartExample4.data}
                    options={chartExample4.options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        </Row>
        <Row>
          <Col lg="6" md="12">
            <Card className="card-tasks">
              <CardHeader>
                <h6 className="title d-inline">Tasks(5)</h6>
                <p className="card-category d-inline"> today</p>
                <UncontrolledDropdown>
                  <DropdownToggle
                    caret
                    className="btn-icon"
                    color="link"
                    data-toggle="dropdown"
                    type="button"
                  >
                    <i className="tim-icons icon-settings-gear-63" />
                  </DropdownToggle>
                  <DropdownMenu aria-labelledby="dropdownMenuLink" right>
                    <DropdownItem
                      href="#pablo"
                      onClick={(e) => e.preventDefault()}
                    >
                      Action
                    </DropdownItem>
                    <DropdownItem
                      href="#pablo"
                      onClick={(e) => e.preventDefault()}
                    >
                      Another action
                    </DropdownItem>
                    <DropdownItem
                      href="#pablo"
                      onClick={(e) => e.preventDefault()}
                    >
                      Something else
                    </DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </CardHeader>
              <CardBody>
                <div className="table-full-width table-responsive">
                  <Table>
                    <tbody>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input defaultValue="" type="checkbox" />
                              <span className="form-check-sign">
                                <span className="check" />
                              </span>
                            </Label>
                          </FormGroup>
                        </td>
                        <td>
                          <p className="title">Update the Documentation</p>
                          <p className="text-muted">
                            Dwuamish Head, Seattle, WA 8:47 AM
                          </p>
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            color="link"
                            id="tooltip636901683"
                            title=""
                            type="button"
                          >
                            <i className="tim-icons icon-pencil" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip636901683"
                            placement="right"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input
                                defaultChecked
                                defaultValue=""
                                type="checkbox"
                              />
                              <span className="form-check-sign">
                                <span className="check" />
                              </span>
                            </Label>
                          </FormGroup>
                        </td>
                        <td>
                          <p className="title">GDPR Compliance</p>
                          <p className="text-muted">
                            The GDPR is a regulation that requires businesses to
                            protect the personal data and privacy of Europe
                            citizens for transactions that occur within EU
                            member states.
                          </p>
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            color="link"
                            id="tooltip457194718"
                            title=""
                            type="button"
                          >
                            <i className="tim-icons icon-pencil" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip457194718"
                            placement="right"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input defaultValue="" type="checkbox" />
                              <span className="form-check-sign">
                                <span className="check" />
                              </span>
                            </Label>
                          </FormGroup>
                        </td>
                        <td>
                          <p className="title">Solve the issues</p>
                          <p className="text-muted">
                            Fifty percent of all respondents said they would be
                            more likely to shop at a company
                          </p>
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            color="link"
                            id="tooltip362404923"
                            title=""
                            type="button"
                          >
                            <i className="tim-icons icon-pencil" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip362404923"
                            placement="right"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input defaultValue="" type="checkbox" />
                              <span className="form-check-sign">
                                <span className="check" />
                              </span>
                            </Label>
                          </FormGroup>
                        </td>
                        <td>
                          <p className="title">Release v2.0.0</p>
                          <p className="text-muted">
                            Ra Ave SW, Seattle, WA 98116, SUA 11:19 AM
                          </p>
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            color="link"
                            id="tooltip818217463"
                            title=""
                            type="button"
                          >
                            <i className="tim-icons icon-pencil" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip818217463"
                            placement="right"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input defaultValue="" type="checkbox" />
                              <span className="form-check-sign">
                                <span className="check" />
                              </span>
                            </Label>
                          </FormGroup>
                        </td>
                        <td>
                          <p className="title">Export the processed files</p>
                          <p className="text-muted">
                            The report also shows that consumers will not easily
                            forgive a company once a breach exposing their
                            personal data occurs.
                          </p>
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            color="link"
                            id="tooltip831835125"
                            title=""
                            type="button"
                          >
                            <i className="tim-icons icon-pencil" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip831835125"
                            placement="right"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FormGroup check>
                            <Label check>
                              <Input defaultValue="" type="checkbox" />
                              <span className="form-check-sign">
                                <span className="check" />
                              </span>
                            </Label>
                          </FormGroup>
                        </td>
                        <td>
                          <p className="title">Arival at export process</p>
                          <p className="text-muted">
                            Capitol Hill, Seattle, WA 12:34 AM
                          </p>
                        </td>
                        <td className="td-actions text-right">
                          <Button
                            color="link"
                            id="tooltip217595172"
                            title=""
                            type="button"
                          >
                            <i className="tim-icons icon-pencil" />
                          </Button>
                          <UncontrolledTooltip
                            delay={0}
                            target="tooltip217595172"
                            placement="right"
                          >
                            Edit Task
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="6" md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Simple Table</CardTitle>
              </CardHeader>
              <CardBody>
                <Table className="tablesorter" responsive>
                  <thead className="text-primary">
                    <tr>
                      <th>Name</th>
                      <th>Country</th>
                      <th>City</th>
                      <th className="text-center">Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dakota Rice</td>
                      <td>Niger</td>
                      <td>Oud-Turnhout</td>
                      <td className="text-center">$36,738</td>
                    </tr>
                    <tr>
                      <td>Minerva Hooper</td>
                      <td>Curaçao</td>
                      <td>Sinaai-Waas</td>
                      <td className="text-center">$23,789</td>
                    </tr>
                    <tr>
                      <td>Sage Rodriguez</td>
                      <td>Netherlands</td>
                      <td>Baileux</td>
                      <td className="text-center">$56,142</td>
                    </tr>
                    <tr>
                      <td>Philip Chaney</td>
                      <td>Korea, South</td>
                      <td>Overland Park</td>
                      <td className="text-center">$38,735</td>
                    </tr>
                    <tr>
                      <td>Doris Greene</td>
                      <td>Malawi</td>
                      <td>Feldkirchen in Kärnten</td>
                      <td className="text-center">$63,542</td>
                    </tr>
                    <tr>
                      <td>Mason Porter</td>
                      <td>Chile</td>
                      <td>Gloucester</td>
                      <td className="text-center">$78,615</td>
                    </tr>
                    <tr>
                      <td>Jon Porter</td>
                      <td>Portugal</td>
                      <td>Gloucester</td>
                      <td className="text-center">$98,615</td>
                    </tr>
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row> */}
      </div>
    </>
  );
}

export default Dashboard;
