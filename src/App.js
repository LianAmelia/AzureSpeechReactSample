import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            textRecognizing: 'INITIALIZED: ready to test speech...',
            recognizer: null,
            textRecognized: ''
        }
    }
    
    async componentDidMount() {
        // check for valid speech key/region
        const tokenRes = await getTokenOrRefresh();
        if (tokenRes.authToken === null) {
            this.setState({
                displayText: 'FATAL_ERROR: ' + tokenRes.error
            });
        }
    }

    async sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'fr-FR';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        this.setState({
            textRecognizing: 'speak into your microphone...',
        });

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                textRecognizing: displayText
            });
        });
    }

    async signalStartFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'fr-FR';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        this.setState({
            textRecognizing: 'speak into your microphone...',
            recognizer
        });

        recognizer.startContinuousRecognitionAsync();
        recognizer.recognizing = (_, event) => {
            this.setState({
                textRecognizing: `RECOGNIZING: Text=${event.result.text}`
            });
        };

        recognizer.recognized = (sender, e) => {
            if (e.result.reason === ResultReason.RecognizedSpeech) {
                this.setState({
                    textRecognized: this.state.textRecognized + " "+ e.result.text
                });
            }
            else if (e.result.reason === ResultReason.NoMatch) {
                this.setState({
                    displayText: "NOMATCH: Speech could not be recognized."
                });
            }
        };
    }

    signalEndFromMic() {
        if (this.state.recognizer === null) {
            return;
        } 

        this.state.recognizer.stopContinuousRecognitionAsync();
        this.setState({
            recognizer: null
        });
    }

    async fileChange(event) {
        const audioFile = event.target.files[0];
        console.log(audioFile);
        const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

        this.setState({
            displayText: fileInfo
        });

        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                displayText: fileInfo + displayText
            });
        });
    }

    render() {
        return (
            <Container className="app-container">
                <h1 className="display-4 mb-3">Speech sample app</h1>

                <div className="row main-container">
                    <div className="col-6">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMic()}></i>
                        Convert speech to text from your mic and stops after first utterance.

                        <div></div>

                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.signalStartFromMic()}></i>
                        Start speech to text.

                        <div></div>

                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.signalEndFromMic()}></i>
                        End speech to text.

                        <div className="mt-2">
                            <label htmlFor="audio-file"><i className="fas fa-file-audio fa-lg mr-2"></i></label>
                            <input 
                                type="file" 
                                id="audio-file" 
                                onChange={(e) => this.fileChange(e)} 
                                style={{display: "none"}} 
                            />
                            Convert speech to text from an audio file.
                        </div>
                    </div>
                    <div className="col-6 output-display rounded">
                        <code>{this.state.textRecognizing}</code>
                        <div></div>
                        <code>{this.state.textRecognized}</code>
                    </div>
                </div>
            </Container>
        );
    }
}