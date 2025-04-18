package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
)

type ChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type AIModelAPI struct {
	AIName    string
	Model     string
	APIURL    string
	UseAPIKey bool
	APIKey    string
}

var (
	AI0 = AIModelAPI{
		AIName:    "AI0",
		Model:     "deepseek-ai/DeepSeek-V3-0324",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
	AI1 = AIModelAPI{
		AIName:    "AI1",
		Model:     "chutesai/Mistral-Small-3.1-24B-Instruct-2503",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
	AI2 = AIModelAPI{
		AIName:    "AI2",
		Model:     "cognitivecomputations/Dolphin3.0-Mistral-24B",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
	AI3 = AIModelAPI{
		AIName:    "AI3",
		Model:     "cognitivecomputations/Dolphin3.0-R1-Mistral-24B",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
	AI4 = AIModelAPI{
		AIName:    "AI4",
		Model:     "Qwen/Qwen2.5-VL-32B-Instruct",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
	AI5 = AIModelAPI{
		AIName:    "AI5",
		Model:     "open-r1/OlympicCoder-32B",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
	AI6 = AIModelAPI{
		AIName:    "AI6",
		Model:     "RekaAI/reka-flash-3",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
	AI7 = AIModelAPI{
		AIName:    "AI7",
		Model:     "deepseek-ai/DeepSeek-V3-Base",
		APIURL:    "https://llm.chutes.ai/v1/chat/completions",
		UseAPIKey: true,
		APIKey:    "cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1",
	}
)

func main() {
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/get-response", getResponseHandler)
	// 添加CORS支持
	http.HandleFunc("/api/get-response", corsMiddleware(getResponseHandler))
	log.Println("Server started on :8091")
	log.Fatal(http.ListenAndServe(":8091", nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "index.html")
}

func getResponseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		AIName   string        `json:"ai"`
		Messages []ChatMessage `json:"messages"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Println("cur aiName: ", request.AIName)
	var aiModel AIModelAPI
	switch request.AIName {
	case AI0.Model:
		aiModel = AI0
	case AI1.Model:
		aiModel = AI1
	case AI2.Model:
		aiModel = AI2
	case AI3.Model:
		aiModel = AI3
	case AI4.Model:
		aiModel = AI4
	case AI5.Model:
		aiModel = AI5
	case AI6.Model:
		aiModel = AI6
	case AI7.Model:
		aiModel = AI7
	default:
		err := fmt.Errorf("Invalid AIName: %s", request.AIName)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// fmt.Println("request.Messages: ", request.Messages)
	response, err := getAIResponse(aiModel, request.Messages)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"content": processContent(response),
	})
}

func getAIResponse(aiModel AIModelAPI, messages []ChatMessage) (string, error) {
	apiKey := aiModel.APIKey
	model := aiModel.Model
	apiURL := aiModel.APIURL
	useAPIKey := aiModel.UseAPIKey
	reqBody, _ := json.Marshal(ChatRequest{
		Model:    model,
		Messages: messages,
	})

	client := &http.Client{}
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(string(reqBody)))
	if err != nil {
		fmt.Println("req err: ", err)
		return "", err
	}

	if useAPIKey {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("resp err: ", err)
		return "", err
	}
	defer resp.Body.Close()

	var response ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		fmt.Println("json err: ", err)
		return "", err
	}

	fmt.Println("response: ", response)
	return response.Choices[0].Message.Content, nil
}

func processContent(content string) string {
	// 处理<think>标签
	// content = strings.ReplaceAll(content, "<think>", "<div class='think'>")
	// content = strings.ReplaceAll(content, "</think>", "</div>")
	re := regexp.MustCompile(`<reasoning>[\s\S]*?</reasoning>`)
	content = re.ReplaceAllString(content, "")
	think := regexp.MustCompile(`<think>[\s\S]*?</think>`)
	content = think.ReplaceAllString(content, "")

	return content
}

// 添加CORS中间件
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	}
}
