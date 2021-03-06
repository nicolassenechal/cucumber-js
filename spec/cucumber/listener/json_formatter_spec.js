require('../../support/spec_helper');

describe("Cucumber.Listener.JsonFormatterWrapper", function () {
  var Cucumber = requireLib('cucumber');
  var listener, failedStepResults;

  beforeEach(function () {
    spyOn(process.stdout, 'write');
    listener  = Cucumber.Listener.JsonFormatter(process.stdout);
    formatter = listener.getGherkinFormatter();
    spyOn(formatter, 'uri');
    spyOn(formatter, 'feature');
    spyOn(formatter, 'step');
    spyOn(formatter, 'background');
    spyOn(formatter, 'scenario');
    spyOn(formatter, 'result');
    spyOn(formatter, 'match');
    spyOn(formatter, 'eof');
    spyOn(formatter, 'done');
  });

  describe("handleBeforeFeatureEvent()", function () {
    var event, feature, callback;

    beforeEach(function () {
      feature = createSpyWithStubs("feature", {
        getKeyword: 'Feature',
        getName: 'A Feature Name',
        getDescription: 'A Description',
        getLine: 3,
        getUri: undefined,
        getTags: false
      });
      event    = createSpyWithStubs("event", {getPayloadItem: feature});
      callback = createSpy("callback");
    });

    it("adds the feature attributes to the output", function () {
      listener.handleBeforeFeatureEvent(event, callback);
      expect(formatter.uri).toHaveBeenCalledWith(undefined);
      expect(formatter.feature).toHaveBeenCalledWith({
        id: 'A-Feature-Name',
        name: 'A Feature Name',
        description: 'A Description',
        line: 3,
        keyword: 'Feature'
      });
    });
  });

  // Handle Background

  describe("handleBackgroundEvent()", function () {

    var parentFeatureEvent, background, step, steps, event, callback;

    beforeEach(function () {
      feature = createSpyWithStubs("feature", {
        getKeyword: 'Feature',
        getName: 'A Name',
        getDescription: 'A Description',
        getLine: 3,
        getUri: 'feature-uri',
        getTags: false
      });
      parentFeatureEvent = createSpyWithStubs("event", {getPayloadItem: feature});
      step = createSpyWithStubs("step", {
        getName: 'Step',
        getLine: 3,
        getKeyword: 'Step',
        hasDocString: false,
        hasDataTable: false
      });
      steps = [step];
      background = createSpyWithStubs("background", {
        getKeyword: 'Background',
        getName: 'A Name',
        getDescription: 'A Description',
        getLine: 3,
        getSteps: steps
      });
      event    = createSpyWithStubs("event", {getPayloadItem: background});
      callback = createSpy("callback");
    });

    it("adds the background attributes to the output", function () {
      listener.handleBackgroundEvent(event, callback);
      expect(formatter.background).toHaveBeenCalledWith({
        name: 'A Name',
        keyword: 'Background',
        description: 'A Description',
        type: 'background',
        line: 3
      });
    });
  });

  // Handle Scenario

  describe("handleBeforeScenarioEvent()", function () {
    var parentFeatureEvent, scenario, callback;

    beforeEach(function () {
      feature = createSpyWithStubs("feature", {
        getKeyword: 'Feature',
        getName: 'A Name',
        getDescription: 'A Description',
        getLine: 3,
        getUri: 'feature-uri',
        getTags: false
      });
      parentFeatureEvent = createSpyWithStubs("event", {getPayloadItem: feature});
      scenario = createSpyWithStubs("scenario", {
        getKeyword: 'Scenario',
        getName: 'A Name',
        getDescription: 'A Description',
        getLine: 3,
        getTags: false
      });
      event    = createSpyWithStubs("event", {getPayloadItem: scenario});
      callback = createSpy("callback");
    });

    it("adds the scenario attributes to the output", function () {
      listener.handleBeforeScenarioEvent(event, callback);
      expect(formatter.scenario).toHaveBeenCalledWith({
        name: 'A Name',
        id: 'undefined;a-name',
        line: 3,
        keyword: 'Scenario',
        description: 'A Description',
        type: 'scenario'
      });
    });
  });

  describe("formatStep()", function () {
    it("adds name, line and keyword to the step properties", function (){
      var step = createSpyWithStubs("step", {
        getName: 'Step',
        getLine: 3,
        getKeyword: 'Step',
        hasDocString: false,
        hasDataTable: false
      });

      listener.formatStep(step);
      expect(formatter.step).toHaveBeenCalledWith({ name : 'Step', line : 3, keyword : 'Step'});
    });

    it("if the step has one, adds a DocString to the step properties", function (){
      var fakeDocString = createSpyWithStubs("docString", {
        getContents: "This is a DocString",
        getLine: 3,
        getContentType: null
      });

      var step = createSpyWithStubs("step", {
        getName: 'Step',
        getLine: 3,
        getKeyword: 'Step',
        hasDocString: true,
        hasDataTable: false,
        getDocString: fakeDocString
      });

      listener.formatStep(step);
      expect(formatter.step).toHaveBeenCalledWith({
        name: 'Step',
        line: 3,
        keyword: 'Step',
        doc_string: {
          value: 'This is a DocString',
          line: 3,
          content_type: null
        }
      });
    });

    it("if the step has one, adds a DataTable to the step properties", function (){
      var fakeContents = createSpyWithStubs("row", {
        raw: [
          ['a:1', 'a:2', 'a:3'],
          ['b:1', 'b:2', 'b:3'],
          ['c:1', 'c:2', 'c:3']
        ]
      })
      var fakeDataTable = createSpyWithStubs("dataTable", { getContents: fakeContents });
      var step = createSpyWithStubs("step", {
        getName: 'Step',
        getLine: 3,
        getKeyword: 'Step',
        hasDocString: false,
        hasDataTable: true,
        getDataTable: fakeDataTable
      });
      listener.formatStep(step);
      expect(formatter.step).toHaveBeenCalledWith({
        name: 'Step',
        line: 3,
        keyword: 'Step',
        rows: [
          {line : undefined, cells: ['a:1', 'a:2', 'a:3'] },
          {line : undefined, cells: ['b:1', 'b:2', 'b:3'] },
          {line : undefined, cells: ['c:1', 'c:2', 'c:3'] }
        ]
      });
    });
  });

  describe("formatTags()", function () {
    it("returns the given tags in the format expected by the JSON formatter", function () {
      var tags = [
        createSpyWithStubs("tag", {getName: "tag_one", getLine:1}),
        createSpyWithStubs("tag", {getName: "tag_two", getLine:2}),
        createSpyWithStubs("tag", {getName: "tag_three", getLine:3})
      ];
      expect(listener.formatTags(tags, null)).toEqual([
        {name: 'tag_one', line :1},
        {name: 'tag_two', line :2},
        {name: 'tag_three', line :3}
      ]);
    });

    it("filters out any tags it is told to ignore - e.g. those of the parent feature", function (){
      var tags = [
        createSpyWithStubs("tag", {getName: "tag_one", getLine:1}),
        createSpyWithStubs("tag", {getName: "tag_two", getLine:2}),
        createSpyWithStubs("tag", {getName: "parent_one", getLine:3}),
        createSpyWithStubs("tag", {getName: "parent_two", getLine:3})
      ];

      var parent_tags = [
        createSpyWithStubs("tag", {getName: "parent_one", getLine:3}),
        createSpyWithStubs("tag", {getName: "parent_two", getLine:3})
      ];
      expect(listener.formatTags(tags, parent_tags)).toEqual([
        {name: 'tag_one', line :1},
        {name: 'tag_two', line :2}
      ]);
    });
  });

  describe("handleStepResultEvent()", function () {
    var event, callback, step, stepResult;

    beforeEach(function () {
      callback = createSpy("Callback");
    });

    describe("when no result has been defined", function() {
      beforeEach(function() {
        step = createSpyWithStubs("step", {
          getName:      'Step',
          getLine:      3,
          getKeyword:   'Step',
          hasDocString: false,
          hasDataTable: false
        });
        stepResult = createSpyWithStubs("stepResult", {
          isSuccessful:        undefined,
          isPending:           undefined,
          isFailed:            undefined,
          isSkipped:           undefined,
          isUndefined:         undefined,
          getFailureException: false,
          getDuration:         undefined,
          getStep:             step,
          hasAttachments:      false
        });
        fakeEvent = createSpyWithStubs("event", {getPayloadItem: stepResult});
      });

      it("outputs a step with failed status", function () {
        listener.handleStepResultEvent(fakeEvent, callback);

        expect(formatter.step).toHaveBeenCalledWith({name: 'Step', line: 3, keyword: 'Step'});
        expect(formatter.result).toHaveBeenCalledWith({status: 'failed'});
        expect(formatter.match).toHaveBeenCalledWith({location: undefined});
      });

      describe("when step result has attachments", function() {
        var embeddings;

        beforeEach(function() {
          embeddings  = createSpy("embeddings");
          stepResult.hasAttachments.andReturn(true);
          spyOn(listener, 'getEmbeddingsFromStepResult').andReturn(embeddings);
        });

        it("outputs a step with failed status", function () {
          listener.handleStepResultEvent(fakeEvent, callback);

          expect(listener.getEmbeddingsFromStepResult).toHaveBeenCalledWith(stepResult);
          expect(formatter.result).toHaveBeenCalledWith({status: 'failed', embeddings: embeddings});
        });
      });
    });

    describe("when step has succeeded", function() {
      beforeEach(function() {
        step = createSpyWithStubs("step", {
          getName:      'Step',
          getLine:      3,
          getKeyword:   'Step',
          hasDocString: false,
          hasDataTable: false
        });
        stepResult = createSpyWithStubs("stepResult", {
          isSuccessful:        undefined,
          isPending:           undefined,
          isFailed:            undefined,
          isSkipped:           undefined,
          isUndefined:         undefined,
          getFailureException: false,
          getDuration:         undefined,
          getStep:             step,
          hasAttachments:      false
        });
        stepResult.isSuccessful.andReturn(true);
        stepResult.getDuration.andReturn(1);
        fakeEvent = createSpyWithStubs("event", {getPayloadItem: stepResult});
      });

      it("outputs a step with passed status", function (){
        listener.handleStepResultEvent(fakeEvent, callback);

        expect(formatter.step).toHaveBeenCalledWith({name: 'Step', line: 3, keyword: 'Step'});
        expect(formatter.result).toHaveBeenCalledWith({status: 'passed', duration: 1});
        expect(formatter.match).toHaveBeenCalledWith({location: undefined});
      });

      describe("when step result has attachments", function() {
        var embeddings;

        beforeEach(function() {
          embeddings  = createSpy("embeddings");
          stepResult.hasAttachments.andReturn(true);
          spyOn(listener, 'getEmbeddingsFromStepResult').andReturn(embeddings);
        });

        it("outputs a step with passed status", function () {
          listener.handleStepResultEvent(fakeEvent, callback);

          expect(listener.getEmbeddingsFromStepResult).toHaveBeenCalledWith(stepResult);
          expect(formatter.result).toHaveBeenCalledWith({status: 'passed', duration: 1, embeddings: embeddings});
        });
      });
    });

    describe("when step is pending", function() {
      beforeEach(function() {
        step = createSpyWithStubs("step", {
          getName: 'Step',
          getLine: 3,
          getKeyword: 'Step',
          hasDocString: false,
          hasDataTable: false
        });

        stepResult = createSpyWithStubs("stepResult", {
          isSuccessful:        undefined,
          isPending:           undefined,
          isFailed:            undefined,
          isSkipped:           undefined,
          isUndefined:         undefined,
          getFailureException: false,
          getDuration:         undefined,
          getStep:             step
        });

        stepResult.isPending.andReturn(true);
        fakeEvent = createSpyWithStubs("event", {getPayloadItem: stepResult});
      });

      it("outputs a step with pending status where step is pending", function (){
        listener.handleStepResultEvent(fakeEvent, callback);

        expect(formatter.step).toHaveBeenCalledWith({name: 'Step', line: 3, keyword: 'Step'});
        expect(formatter.result).toHaveBeenCalledWith({status: 'pending', error_message: undefined});
        expect(formatter.match).toHaveBeenCalledWith({location: undefined});
      });
    });

    describe("when step has failed", function() {
      beforeEach(function() {
        step = createSpyWithStubs("step", {
          getName:      'Step',
          getLine:      3,
          getKeyword:   'Step',
          hasDocString: false,
          hasDataTable: false
        });

        stepResult = createSpyWithStubs("stepResult", {
          isSuccessful:        undefined,
          isPending:           undefined,
          isFailed:            undefined,
          isSkipped:           undefined,
          isUndefined:         undefined,
          getFailureException: false,
          getDuration:         undefined,
          getStep:             step,
          hasAttachments:      false
        });

        stepResult.isFailed.andReturn(true);
        stepResult.getDuration.andReturn(1);
        fakeEvent = createSpyWithStubs("event", {getPayloadItem: stepResult});
      });

      it("outputs a step with failed status", function (){
        listener.handleStepResultEvent(fakeEvent, callback);

        expect(formatter.step).toHaveBeenCalledWith({name: 'Step', line: 3, keyword: 'Step'});
        expect(formatter.result).toHaveBeenCalledWith({status: 'failed', duration: 1});
        expect(formatter.match).toHaveBeenCalledWith({location: undefined});
      });

      describe("when step result has attachments", function() {
        var embeddings;

        beforeEach(function() {
          embeddings  = createSpy("embeddings");
          stepResult.hasAttachments.andReturn(true);
          spyOn(listener, 'getEmbeddingsFromStepResult').andReturn(embeddings);
        });

        it("outputs a step with failed status", function () {
          listener.handleStepResultEvent(fakeEvent, callback);

          expect(listener.getEmbeddingsFromStepResult).toHaveBeenCalledWith(stepResult);
          expect(formatter.result).toHaveBeenCalledWith({status: 'failed', duration: 1, embeddings: embeddings});
        });
      });
    });

    describe("when step is skipped", function() {
      beforeEach(function() {
        step = createSpyWithStubs("step", {
          getName: 'Step',
          getLine: 3,
          getKeyword: 'Step',
          hasDocString: false,
          hasDataTable: false
        });

        stepResult = createSpyWithStubs("stepResult", {
          isSuccessful: undefined,
          isPending:    undefined,
          isFailed:     undefined,
          isSkipped:    undefined,
          isUndefined:  undefined,
          getFailureException: false,
          getDuration:  undefined,
          getStep:      step
        });

        stepResult.isSkipped.andReturn(true);
        fakeEvent      = createSpyWithStubs("event", {getPayloadItem: stepResult});
      });

      it("outputs a step with skipped status where step should be skipped", function (){
        listener.handleStepResultEvent(fakeEvent, callback);

        expect(formatter.step).toHaveBeenCalledWith({name: 'Step', line: 3, keyword: 'Step'});
        expect(formatter.result).toHaveBeenCalledWith({status: 'skipped'});
        expect(formatter.match).toHaveBeenCalledWith({location: undefined});
      });
    });

    describe("when step is undefined", function() {
      beforeEach(function () {
        step = createSpyWithStubs("step", {
          getName: 'Step',
          getLine: 3,
          getKeyword: 'Step',
          hasDocString: false,
          hasDataTable: false
        });

        stepResult = createSpyWithStubs("stepResult", {
          isSuccessful: undefined,
          isPending: undefined,
          isFailed: undefined,
          isSkipped: undefined,
          isUndefined: undefined,
          getFailureException: false,
          getDuration: undefined,
          getStep: step
        });

        stepResult.isUndefined.andReturn(true);
        fakeEvent = createSpyWithStubs("event", {getPayloadItem: stepResult});
      });

      it("outputs a step with undefined status where step is undefined", function () {
        listener.handleStepResultEvent(fakeEvent, callback);

        expect(formatter.step).toHaveBeenCalledWith({name: 'Step', line: 3, keyword: 'Step'});
        expect(formatter.result).toHaveBeenCalledWith({status: 'undefined'});
        expect(formatter.match).toHaveBeenCalledWith({location: undefined});
      });
    });
  });

  describe("getEmbeddingsFromStepResult()", function() {
    var firstMimeType, secondMimeType, firstData, secondData, firstAttachment, secondAttachment;
    var attachments, attachmentCollection, stepResult, embeddings;

    beforeEach(function() {
      firstMimeType        = createSpyWithStubs("first mime type");
      secondMimeType       = createSpyWithStubs("second mime type");
      firstData            = createSpyWithStubs("first data");
      secondData           = createSpyWithStubs("second data");
      firstAttachment      = createSpyWithStubs("first attachment", {getMimeType: firstMimeType, getData: firstData});
      secondAttachment     = createSpyWithStubs("second attachment", {getMimeType: secondMimeType, getData: secondData});
      attachments          = [firstAttachment, secondAttachment]
      attachmentCollection = createSpyWithStubs("attachments");
      spyOnStub(attachmentCollection, 'syncForEach').andCallFake(function(cb) { attachments.forEach(cb); });
      stepResult           = createSpyWithStubs("step result", {getAttachments: attachmentCollection})
      embeddings           = listener.getEmbeddingsFromStepResult(stepResult);
    });

    it("gets the attachments from the step result", function() {
      expect(stepResult.getAttachments).toHaveBeenCalled();
    });

    it("converts the attachments into embeddings", function() {
      expect(embeddings).toEqual([{mime_type: firstMimeType, data: firstData}, {mime_type: secondMimeType, data: secondData}]);
    });
  });

  describe("handleAfterFeaturesEvent()", function () {
    var event, callback;

    beforeEach(function () {
      event    = createSpy("Event");
      callback = createSpy("Callback");
    });

    it("finalises output", function () {
      listener.handleAfterFeaturesEvent(event, callback);
      expect(formatter.eof).toHaveBeenCalled();
      expect(formatter.done).toHaveBeenCalled();
    });

    it("calls back", function () {
      listener.handleAfterFeaturesEvent(event, callback);
      expect(callback).toHaveBeenCalled();
    });
  });
});
